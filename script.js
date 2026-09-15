// ---------- variables that store our app's state ----------
var photos = [];        // list of {name, caption, url}
var currentIndex = 0;
var currentMode = "manual";
var currentTheme = "a";
var displayTime = 2;    // seconds
var timerId = null;

// ---------- grab the HTML elements we need ----------
var stage = document.getElementById("stage");
var photoList = document.getElementById("photoList");
var themeSelect = document.getElementById("themeSelect");
var modeSelect = document.getElementById("modeSelect");
var timeInput = document.getElementById("timeInput");
var dropzone = document.getElementById("dropzone");
var fileInput = document.getElementById("fileInput");

stage.className = "theme-a"; // start on theme A

// ---------- turn a filename into a nice caption ----------
function makeCaption(filename) {
  var name = filename.replace(/\.[^/.]+$/, "");   // remove .jpg/.png etc
  name = name.replace(/-/g, " ");                  // replace hyphens with spaces
  name = name.replace(/_/g, " ");                  // replace underscores with spaces

  var words = name.split(" ");
  var result = "";
  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    if (word.length > 0) {
      var firstLetter = word.charAt(0).toUpperCase();
      var rest = word.slice(1).toLowerCase();
      result = result + firstLetter + rest + " ";
    }
  }
  return result.trim();
}

// ---------- loading photos ----------
dropzone.ondragover = function (event) {
  event.preventDefault();
};

dropzone.ondrop = function (event) {
  event.preventDefault();
  addFiles(event.dataTransfer.files);
};

dropzone.onclick = function (event) {
  if (event.target.id !== "fileInput") {
    fileInput.click();
  }
};

fileInput.onchange = function (event) {
  addFiles(event.target.files);
};

function addFiles(fileListFromInput) {
  for (var i = 0; i < fileListFromInput.length; i++) {
    var file = fileListFromInput[i];
    readOneFile(file);
  }
}

function readOneFile(file) {
  var reader = new FileReader();
  reader.onload = function (event) {
    var newPhoto = {
      name: file.name,
      caption: makeCaption(file.name),
      url: event.target.result
    };
    photos.push(newPhoto);
    drawPhotoList();
    if (photos.length === 1) {
      showSlide(0);
    }
    saveToLocalStorage();
  };
  reader.readAsDataURL(file);
}

// ---------- drawing the small thumbnail list (and drag to reorder) ----------
function drawPhotoList() {
  photoList.innerHTML = "";

  for (var i = 0; i < photos.length; i++) {
    var li = document.createElement("li");
    li.draggable = true;
    li.setAttribute("data-index", i);
    li.innerHTML = "<img src='" + photos[i].url + "'>";

    li.ondragstart = function (event) {
      event.dataTransfer.setData("text", this.getAttribute("data-index"));
    };

    li.ondragover = function (event) {
      event.preventDefault();
    };

    li.ondrop = function (event) {
      event.preventDefault();
      var fromIndex = parseInt(event.dataTransfer.getData("text"));
      var toIndex = parseInt(this.getAttribute("data-index"));

      var movedPhoto = photos.splice(fromIndex, 1)[0];
      photos.splice(toIndex, 0, movedPhoto);

      drawPhotoList();
      saveToLocalStorage();
    };

    photoList.appendChild(li);
  }
}

// ---------- showing a slide ----------
function showSlide(newIndex) {
  if (photos.length === 0) {
    return;
  }

  var oldIndex = currentIndex;  // remember direction BEFORE updating

  // wrap around if index goes below 0 or above the last photo
  if (newIndex < 0) {
    newIndex = photos.length - 1;
  }
  if (newIndex >= photos.length) {
    newIndex = 0;
  }
  currentIndex = newIndex;

  var photo = photos[currentIndex];

  // build the new slide element
  var newSlide = document.createElement("div");
  newSlide.className = "slide";

  var img = document.createElement("img");
  img.src = photo.url;
  newSlide.appendChild(img);

  var caption = document.createElement("div");
  caption.className = "caption";
  caption.textContent = photo.caption;
  newSlide.appendChild(caption);

  stage.appendChild(newSlide);

  var oldSlide = stage.querySelector(".slide.show");

  // theme D just stacks photos, never removes old ones (except to limit count)
  if (currentTheme === "d") {
    var rotation = Math.floor(Math.random() * 10) - 5;

    // set starting position: off-left, no rotation yet
    newSlide.style.transform = "translateX(-150px) rotate(0deg)";

    setTimeout(function () {
      newSlide.classList.add("show");
      // set ending position: centered, with random tilt
      newSlide.style.transform = "translateX(0) rotate(" + rotation + "deg)";
    }, 20);

    var allSlides = stage.querySelectorAll(".slide");
    if (allSlides.length > 6) {
      allSlides[0].remove();
    }
    return;
  }

  // theme E (window): the old photo splits into two halves that
  // swing outward, revealing the new photo sitting behind them
  if (currentTheme === "e") {
    // the new photo appears instantly, behind the panels
    newSlide.classList.add("show");

    if (oldSlide) {
      var leftPanel = document.createElement("div");
      leftPanel.className = "panel left";

      var leftInner = document.createElement("div");
      leftInner.className = "inner slide";   // reuse .slide's centering styles
      leftInner.innerHTML = oldSlide.innerHTML;
      leftPanel.appendChild(leftInner);

      var rightPanel = document.createElement("div");
      rightPanel.className = "panel right";

      var rightInner = document.createElement("div");
      rightInner.className = "inner slide";
      rightInner.innerHTML = oldSlide.innerHTML;
      rightPanel.appendChild(rightInner);

      oldSlide.remove();

      stage.appendChild(leftPanel);
      stage.appendChild(rightPanel);

      // tiny delay so the browser notices the "closed" state before opening
      setTimeout(function () {
        leftPanel.classList.add("open");
        rightPanel.classList.add("open");
      }, 20);

      setTimeout(function () {
        leftPanel.remove();
        rightPanel.remove();
      }, 800);
    }
    return;
  }

  // theme F (cube): decide which way the cube turns
  if (currentTheme === "f" || currentTheme === "g") {
    var forward = (newIndex > oldIndex) ||
                  (newIndex === 0 && oldIndex === photos.length - 1);
    if (newIndex === oldIndex) {
      forward = true;
    }

    if (!forward) {
      newSlide.classList.add("rev");
      if (oldSlide) {
        oldSlide.classList.add("rev");
      }
    }

    // tiny delay so the browser notices the "start" style before we animate
    setTimeout(function () {
      newSlide.classList.add("show");
    }, 20);

    if (oldSlide) {
      oldSlide.classList.remove("show");
      oldSlide.classList.add("hide");
      setTimeout(function () {
        oldSlide.remove();
      }, 800);
    }
    return;
  }

  // for all other themes: fade/slide the new one in, and the old one out
  setTimeout(function () {
    newSlide.classList.add("show");
  }, 20);

  if (oldSlide) {
    oldSlide.classList.remove("show");
    oldSlide.classList.add("hide");
    setTimeout(function () {
      oldSlide.remove();
    }, 800);
  }
}

function nextSlide() {
  showSlide(currentIndex + 1);
}

function prevSlide() {
  showSlide(currentIndex - 1);
}

function randomSlide() {
  var randomIndex = Math.floor(Math.random() * photos.length);
  showSlide(randomIndex);
}

// ---------- playback modes ----------
function setMode(newMode) {
  currentMode = newMode;
  modeSelect.value = newMode;

  clearInterval(timerId);

  if (currentMode === "auto") {
    timerId = setInterval(nextSlide, displayTime * 1000);
  } else if (currentMode === "random") {
    timerId = setInterval(randomSlide, displayTime * 1000);
  }
  saveToLocalStorage();
}

document.addEventListener("keydown", function (event) {
  // open the command bar with Ctrl+K or "/" (unless already typing somewhere)
  var typing = document.activeElement && document.activeElement.tagName === "INPUT";
  if ((event.ctrlKey && (event.key === "k" || event.key === "K")) ||
      (event.key === "/" && !typing)) {
    event.preventDefault();
    if (commandOpen) {
      closeCommandBar();
    } else {
      openCommandBar();
    }
    return;
  }

  // ESC closes the command bar
  if (event.key === "Escape" && commandOpen) {
    closeCommandBar();
    return;
  }

  // while the command bar is open, don't trigger slideshow shortcuts
  if (commandOpen) {
    return;
  }

  if (currentMode === "manual") {
    if (event.key === "ArrowRight") {
      nextSlide();
    }
    if (event.key === "ArrowLeft") {
      prevSlide();
    }
  }
});

modeSelect.onchange = function () {
  setMode(this.value);
};

themeSelect.onchange = function () {
  currentTheme = this.value;
  stage.className = "theme-" + currentTheme; // e.g. "theme-b"
  stage.innerHTML = "";
  showSlide(currentIndex);
  saveToLocalStorage();
};

timeInput.onchange = function () {
  displayTime = parseInt(this.value) || 2;
  setMode(currentMode); // restart the timer with the new time
};

document.getElementById("fullscreenBtn").onclick = function () {
  stage.requestFullscreen();
};

// ---------- export / import as JSON ----------
document.getElementById("exportBtn").onclick = function () {
  var data = {
    photos: photos,
    theme: currentTheme,
    mode: currentMode,
    displayTime: displayTime
  };
  var jsonText = JSON.stringify(data);
  var blob = new Blob([jsonText], { type: "application/json" });

  var link = document.createElement("a");
  link.download = "slideshow-" + Date.now() + ".json";
  link.href = URL.createObjectURL(blob);
  link.click();
};

document.getElementById("importInput").onchange = function (event) {
  var reader = new FileReader();
  reader.onload = function (readEvent) {
    var data = JSON.parse(readEvent.target.result);

    photos = data.photos || [];
    currentTheme = data.theme || "a";
    displayTime = data.displayTime || 2;

    themeSelect.value = currentTheme;
    stage.className = "theme-" + currentTheme;
    timeInput.value = displayTime;

    drawPhotoList();
    stage.innerHTML = "";
    showSlide(0);
    setMode(data.mode || "manual");
    saveToLocalStorage();
  };
  reader.readAsText(event.target.files[0]);
};

document.getElementById("resetBtn").onclick = function () {
  photos = [];
  currentIndex = 0;
  stage.innerHTML = "";
  photoList.innerHTML = "";
  localStorage.removeItem("slideshowData");
};

// ---------- saving/loading so refresh doesn't lose your work ----------
function saveToLocalStorage() {
  var data = {
    photos: photos,
    theme: currentTheme,
    mode: currentMode,
    displayTime: displayTime,
    currentIndex: currentIndex
  };
  localStorage.setItem("slideshowData", JSON.stringify(data));
}

function loadFromLocalStorage() {
  var saved = localStorage.getItem("slideshowData");
  if (!saved) {
    return;
  }
  var data = JSON.parse(saved);

  photos = data.photos || [];
  currentTheme = data.theme || "a";
  displayTime = data.displayTime || 2;
  currentIndex = data.currentIndex || 0;

  themeSelect.value = currentTheme;
  stage.className = "theme-" + currentTheme;
  timeInput.value = displayTime;

  drawPhotoList();
  if (photos.length > 0) {
    showSlide(currentIndex);
  }
  setMode(data.mode || "manual");
}


// ---------- command bar (settings dropdown) ----------
var settingsBtn = document.getElementById("settingsBtn");
var commandBar = document.getElementById("commandBar");
var commandInput = document.getElementById("commandInput");
var commandList = document.getElementById("commandList");
var dimOverlay = document.getElementById("dimOverlay");
var commandOpen = false;
var activeIndex = 0;
var filteredCommands = [];

function switchThemeByCommand(themeValue) {
  themeSelect.value = themeValue;
  themeSelect.onchange();   // reuse the existing handler
}

var commands = [
  { label: "Switch theme: A - Swap",    action: function () { switchThemeByCommand("a"); } },
  { label: "Switch theme: B - Slide",   action: function () { switchThemeByCommand("b"); } },
  { label: "Switch theme: C - Push",    action: function () { switchThemeByCommand("c"); } },
  { label: "Switch theme: D - Stack",   action: function () { switchThemeByCommand("d"); } },
  { label: "Switch theme: E - Split",   action: function () { switchThemeByCommand("e"); } },
  { label: "Switch theme: F - Cube",    action: function () { switchThemeByCommand("f"); } },
  { label: "Switch theme: G - Switch",  action: function () { switchThemeByCommand("g"); } },
  { label: "Switch theme: H - Custom",  action: function () { switchThemeByCommand("h"); } },
  { label: "Mode: Manual Control",      action: function () { setMode("manual"); } },
  { label: "Mode: Autoplay",            action: function () { setMode("auto"); } },
  { label: "Mode: Random",              action: function () { setMode("random"); } },
  { label: "Toggle fullscreen",         action: function () { stage.requestFullscreen(); } },
  { label: "Export slideshow (JSON)",   action: function () { document.getElementById("exportBtn").onclick(); } },
  { label: "Import slideshow (JSON)",   action: function () { document.getElementById("importInput").click(); } },
  { label: "Reset slideshow",           action: function () { document.getElementById("resetBtn").onclick(); } }
];

function renderCommands() {
  commandList.innerHTML = "";

  var query = commandInput.value.toLowerCase();
  filteredCommands = [];
  for (var i = 0; i < commands.length; i++) {
    if (commands[i].label.toLowerCase().indexOf(query) !== -1) {
      filteredCommands.push(commands[i]);
    }
  }
  if (activeIndex >= filteredCommands.length) {
    activeIndex = 0;
  }

  for (var j = 0; j < filteredCommands.length; j++) {
    var li = document.createElement("li");
    li.textContent = filteredCommands[j].label;
    if (j === activeIndex) {
      li.className = "active";
    }
    li.onclick = (function (index) {
      return function () {
        runCommand(index);
      };
    })(j);
    commandList.appendChild(li);
  }

  // keep the highlighted command visible while arrowing through the list
  var activeLi = commandList.querySelector("li.active");
  if (activeLi) {
    activeLi.scrollIntoView({ block: "nearest" });
  }
}

function runCommand(index) {
  var cmd = filteredCommands[index];
  closeCommandBar();
  if (cmd) {
    cmd.action();
  }
}

function openCommandBar() {
  commandOpen = true;
  commandBar.classList.remove("hidden");
  dimOverlay.classList.add("visible");
  commandInput.value = "";
  activeIndex = 0;
  renderCommands();
  commandInput.focus();
}

function closeCommandBar() {
  commandOpen = false;
  commandBar.classList.add("hidden");
  dimOverlay.classList.remove("visible");
  commandInput.blur();
}

settingsBtn.onclick = function (event) {
  event.stopPropagation();
  if (commandOpen) {
    closeCommandBar();
  } else {
    openCommandBar();
  }
};

dimOverlay.onclick = closeCommandBar;

commandInput.oninput = function () {
  activeIndex = 0;
  renderCommands();
};

commandInput.onkeydown = function (event) {
  event.stopPropagation();   // keep keys from reaching the slideshow handler
  if (event.key === "ArrowDown") {
    event.preventDefault();
    activeIndex = Math.min(activeIndex + 1, filteredCommands.length - 1);
    renderCommands();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    activeIndex = Math.max(activeIndex - 1, 0);
    renderCommands();
  } else if (event.key === "Enter") {
    event.preventDefault();
    runCommand(activeIndex);
  } else if (event.key === "Escape") {
    event.preventDefault();
    closeCommandBar();
  }
};

// ---------- run this when the page loads ----------
loadFromLocalStorage();