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

  // wrap around if index goes below 0 or above the last photo
  if (newIndex < 0) {
    newIndex = photos.length - 1;
  }
  if (newIndex >= photos.length) {
    newIndex = 0;
  }
  currentIndex = newIndex;

  var photo = photos[currentIndex];
  if(currentTheme === "e")
  {
    var newSlide = document.createElement("div");
    newSlide.className = "slide";
    // newSlide.style.background = `url('${photo.url}') center/cover`;

    var left = document.createElement('div');
    left.className = "left";
    left.style.backgroundImage = `url('${photo.url}')`; 

    var right = document.createElement('div');
    right.className = "right";
    right.style.backgroundImage = `url('${photo.url}')`; 
    
    newSlide.append(left);
    newSlide.append(right);

    stage.appendChild(newSlide);
  } else {

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
  }

  // theme D just stacks photos, never removes old ones (except to limit count)
  if (currentTheme === "d") {
    setTimeout(function () {
      newSlide.classList.add("show");
    }, 20);

    var rotation = Math.floor(Math.random() * 10) - 5; // between -5 and 5
    newSlide.style.transform = "rotate(" + rotation + "deg)";

    var allSlides = stage.querySelectorAll(".slide");
    if (allSlides.length > 6) {
      allSlides[0].remove();
    }
    return;
  }

  // for all other themes: fade/slide the new one in, and the old one out
  var oldSlide = stage.querySelector(".slide.show");

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

// ---------- run this when the page loads ----------
loadFromLocalStorage();