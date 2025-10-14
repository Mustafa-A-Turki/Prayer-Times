let loader = document.querySelector(".loader-container");

loader.style.display = "flex";

let noResponseTimeout = setTimeout(() => {
  loader.style.display = "none";
  swal("تنبيه!", "لم يتم الرد على طلب تحديد الموقع. برجاء السماح لإكمال التحميل.", "warning");
}, 7000); 

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position)=>{
    clearTimeout(noResponseTimeout);
    success(position);
  }, 
      (err) => {
      clearTimeout(noResponseTimeout);
      error(err);
    },
  {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 5000,
  });
}

function success(position) {

  const loadingTimeout = setTimeout(() => {
  loader.style.display = "none";
  swal("!خطأ", "فشل تحميل البيانات. تأكد من الاتصال بالإنترنت.", "error");
}, 5000);

  let latitude = position.coords.latitude;
  let longitude = position.coords.longitude;

  fetch(
    `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=5&school=0`
  )
    .then((response) => response.json())
    .then((data) => {
        let timings = data.data.timings;
      if (data.data.meta.timezone.includes("Africa/Cairo")) {
            timings.Fajr = adjustTime(timings.Fajr, 1);    
            timings.Asr = adjustTime(timings.Asr, -1); 
      }

    function adjustTime(time, offsetMinutes) {
      let [h, m] = time.split(":").map(Number);
      m += offsetMinutes;
      if (m >= 60) { h++; m -= 60; }
      if (m < 0) { h--; m += 60; }
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
      let keys = Object.keys(timings);

      if (data && data.data && data.data.timings) {
        clearTimeout(loadingTimeout);
        loader.style.display = "none";
      }
      for (let i = 0; i < keys.length; i++) {
        let prayerTime = document.querySelector(
          `#${keys[i].toLowerCase()} time span`
        );
        if (prayerTime == null) {
          continue;
        }
        prayerTime.innerHTML = convertTo12Hours(timings[keys[i]]);
      }
      nextPrayer(timings, keys);

      // date section
      // // malad date
      let melad_box = document.querySelector(".melad-date time");
      melad_box.setAttribute(
        "datetime",
        `${data.data.date.hijri.weekday.ar}__${data.data.date.readable}`
      );
      melad_box.innerHTML = `${data.data.date.gregorian.date}__${data.data.date.hijri.weekday.ar}`;

      // // hijri date
      let higri_box = document.querySelector(".hegri-date time");
      higri_box.setAttribute(
        "datetime",
        `${data.data.date.hijri.month.ar}__${data.data.date.hijri.date}`
      );
      higri_box.innerHTML = `${data.data.date.hijri.date}__${data.data.date.hijri.month.ar}`;
    })

    .catch((error) => {
      clearTimeout(loadingTimeout);
      loader.style.display = "none";
      swal("خطأ!", "حدثت مشكلة أثناء تحميل البيانات. حاول مرة أخرى.", "error");
    });
}
function error(err) {
  // لو فشل تحديد الموقع استخدم القاهرة كافتراضي
  let defaultLat = 30.0444;
  let defaultLon = 31.2357;

  fetch(
    `https://api.aladhan.com/v1/timings?latitude=${defaultLat}&longitude=${defaultLon}&method=5&school=0`
  )
    .then((response) => response.json())
    .then((data) => success({ coords: { latitude: defaultLat, longitude: defaultLon } }))
    .catch(() => {
      loader.style.display = "none";
      swal("خطأ!", "لم يتم تحميل بيانات القاهرة أيضًا. حاول مجددًا.", "error");
    });
  if (err.code === 1) {
    // المستخدم رفض الإذن
    swal(
      "خطأ!",
      "من فضلك اسمح بالوصول إلى الموقع للحصول على مواقيت الصلاة.",
      "error"
    );
  } else if (err.code === 2) {
    // الجهاز مش قادر يحدد الموقع
    swal(
      "خطأ!",
      "تعذر تحديد موقعك الحالي، تأكد من تشغيل GPS أو الإنترنت.",
      "error"
    );
  } else if (err.code === 3) {
    // انتهى وقت الطلب (Timeout)
    swal("خطأ!", "انتهى وقت المحاولة بدون استجابة. حاول مجددًا.", "error");
  } else {
    // أي خطأ عام آخر
    swal("خطأ!", "لم يتم جلب البيانات. حاول مرة أخرى.", "error");
  }
}

function convertTo12Hours(time) {
  time = time.split(":");

  if (+time[0] > 12) {
    return `0${+time[0] - 12}:${time[1]} PM`;
  } else if (+time[0] < 12) {
    return `${time.join(":")} AM`;
  } else {
    return `${time.join(":")} PM`;
  }
}

// copy to clipbaord

let copyMeladIcon = document.querySelector(".fa-copy-m");
let copyHijriIcon = document.querySelector(".fa-copy-h");

copyMeladIcon.onclick = function (e) {
  let melad_box = document.querySelector(".melad-date time");

  navigator.clipboard.writeText(melad_box.innerHTML);
  setTimeout(() => {
    copyMeladIcon.classList.remove("fa-copy-m", "fa-copy", "fa-regular");
    copyMeladIcon.classList.add("fa-solid", "fa-check");
    setTimeout(() => {
      copyMeladIcon.classList.remove("fa-solid", "fa-check");
      copyMeladIcon.classList.add("fa-copy-m", "fa-copy", "fa-regular");
    }, 1500);
  }, 0);
};

copyHijriIcon.onclick = function (e) {
  let higri_box = document.querySelector(".hegri-date time");

  navigator.clipboard.writeText(higri_box.innerHTML);

  setTimeout(() => {
    copyHijriIcon.classList.remove("fa-copy-m", "fa-copy", "fa-regular");
    copyHijriIcon.classList.add("fa-solid", "fa-check");
    setTimeout(() => {
      copyHijriIcon.classList.remove("fa-solid", "fa-check");
      copyHijriIcon.classList.add("fa-copy-m", "fa-copy", "fa-regular");
    }, 1500);
  }, 0);
};

// detremine the next prayer
function nextPrayer(timings, keys) {
  let now = new Date();
  let smallDifference = Infinity,
    bigDifference = 0;
  let enArObjectForPrayers = {
    Fajr: "الفجر",
    Sunrise: "الشروق",
    Dhuhr: "الظهر",
    Asr: "العصر",
    Maghrib: "المغرب",
    Isha: "العشاء",
  };
  let nextPrayer, previousPrayer;
  let totalNowSeconds =
    new Date().getHours() * 3600 +
    new Date().getMinutes() * 60 +
    new Date().getSeconds();
  for (let i = 0; i < keys.length; i++) {
    timings[keys[i]] = timings[keys[i]].split(":");
    let prayerTime = document.querySelector(
      `#${keys[i].toLowerCase()} time span`
    );
    if (prayerTime == null) {
      continue;
    }
    let hours = +timings[keys[i]][0] * 3600;
    let minute = +timings[keys[i]][1] * 60;
    let totalPrayerSeconds = hours + minute;
    let difference = totalPrayerSeconds - totalNowSeconds;

    if (difference < 0) {
      difference += 24 * 3600;
    }
    if (difference < smallDifference) {
      smallDifference = difference;
      nextPrayer = keys[i];
    }
    if (difference > bigDifference) {
      bigDifference = difference;
      previousPrayer = keys[i];
    }
  }
  if (!nextPrayer) nextPrayer = "Fajr";
  setActivePrayer(nextPrayer);
  let nextPrayerElement = document.querySelector(".inside-circle h3");
  nextPrayerElement.innerHTML = enArObjectForPrayers[nextPrayer];

  let p2 = document.querySelector(".a1 .p2 time");
  let p3 = document.querySelector(".a1 .p3 time");
  let span = document.querySelector(".a1 .p3 span");

  p3.innerHTML = convertTo12Hours(timings[previousPrayer].join(":"));
  p2.innerHTML = convertTo12Hours(timings[nextPrayer].join(":"));
  span.innerHTML = enArObjectForPrayers[previousPrayer];

  // The remaining time until the next prayer

  let theRemainingTimeUntilTheNextPrayer =
    document.querySelector(".a1 h3 time");

  setInterval(() => {
    let totalNowSeconds =
      new Date().getHours() * 3600 +
      new Date().getMinutes() * 60 +
      new Date().getSeconds();
    let hours = +timings[nextPrayer][0] * 3600;
    let minute = +timings[nextPrayer][1] * 60;
    let totalPrayerSeconds = hours + minute;

    let difference = totalPrayerSeconds - totalNowSeconds;
    if (difference < 0) {
      difference += 24 * 3600;
    }
    let timeUntilTheNextPrayer =
      getTheRemainingTimeUntilTheNextPrayer(difference);
    // check if now is the time of prayer
    let arr = timeUntilTheNextPrayer.split(":");
    if (
      (+arr[0] == 0 && +arr[1] == 0 && +arr[2] == 0) ||
      (+arr[0] == 23 && +arr[1] == 59 && +arr[2] == 59)
    ) {
      window.location.reload();
    }
    theRemainingTimeUntilTheNextPrayer.innerHTML = timeUntilTheNextPrayer;

    // progress
    let prevPrayerHours = +timings[previousPrayer][0] * 3600;
    let prevPrayerminute = +timings[previousPrayer][1] * 60;
    let totalPrevPrayerSeconds = prevPrayerHours + prevPrayerminute;
    let differenceBetweenNextAndPrevPrayer =
      totalPrayerSeconds - totalPrevPrayerSeconds;
    if (differenceBetweenNextAndPrevPrayer < 0) {
      differenceBetweenNextAndPrevPrayer += 24 * 3600;
    }
    progress(100 - (difference / differenceBetweenNextAndPrevPrayer) * 100);
  }, 1000);
}

// تغيير نسبة التقدم في الprogress

function progress(percent) {
  const circle = document.getElementById("progress-circle");
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  circle.style.strokeDashoffset = offset;
}

function getTheRemainingTimeUntilTheNextPrayer(totalSeconds) {
  let h = Math.floor(totalSeconds / 3600);
  let m = Math.floor((totalSeconds % 3600) / 60);
  let s = totalSeconds % 60;

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
    s
  ).padStart(2, "0")}`;
}

function setActivePrayer(nextPrayer) {
  // removeActiveFromElement
  let currentActive = document.querySelector(".active");
  currentActive.classList.remove("active");

  let addActiveToNextPrayer = document.querySelector(
    `#${nextPrayer.toLowerCase()}`
  );
  addActiveToNextPrayer.classList.add("active");
}


// switch mode button

let switch_mode_button = document.querySelector(".switch input");

function mode(){
  localStorage.setItem(
    "mode",
    localStorage.getItem("mode")=== "dark" ? "light" : "dark"
  );
  
  document.body.classList.toggle("body-light")
  let prayer_times = document.querySelector(".prayer-times");
  prayer_times.classList.toggle("prayer-times-light");

  let date_section = document.querySelector(".date-section");
  date_section.classList.toggle("date-section-light");

  let next_prayer_section = document.querySelector(".next-prayer-section");
  next_prayer_section.classList.toggle("next-prayer-section-light");

  let date_box = document.querySelector(".dateBox");
  date_box.classList.toggle("dateBox-light");

  let note = document.querySelector(".note");
  note.classList.toggle("note-light");

  let hr = document.querySelector("hr");
  hr.classList.toggle("hr-light");
  
  let next_prayer_section_box = document.querySelector(".next-prayer-section-box");
  next_prayer_section_box.classList.toggle("next-prayer-section-box-light");
  
  let firstCircle = document.querySelector("svg circle:first-of-type");
  let currentStroke = firstCircle.getAttribute("stroke");
  
  firstCircle.setAttribute(
    "stroke",
    currentStroke === "#1f2732" ? "#2a36458d" : "#1f2732"
  );
}

const savedMode = localStorage.getItem("mode");

if (!savedMode) {
  localStorage.setItem("mode", "dark");
} else if (savedMode === "light") {
  document.body.classList.add("body-light");
  document.querySelector(".prayer-times").classList.add("prayer-times-light");
  document.querySelector(".date-section").classList.add("date-section-light");
  document.querySelector(".next-prayer-section").classList.add("next-prayer-section-light");
  document.querySelector(".dateBox").classList.add("dateBox-light");
  document.querySelector(".note").classList.add("note-light");
  document.querySelector("hr").classList.add("hr-light");
  document.querySelector(".next-prayer-section-box").classList.add("next-prayer-section-box-light");
  
  let firstCircle = document.querySelector("svg circle:first-of-type");
  firstCircle.setAttribute("stroke", "#2a36458d");
}

switch_mode_button.checked = savedMode === "dark";
switch_mode_button.onclick = mode;

// top sections heights
let date_section = document.querySelector(".date-section");
let next_prayer_section = document.querySelector(".next-prayer-section");

window.onresize = setHeight;

function setHeight() {
  next_prayer_section.style.height = `${date_section.offsetHeight}px`;
}
setHeight();
