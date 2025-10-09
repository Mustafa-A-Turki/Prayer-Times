if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(success, error, {
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 5000,
  });
} 

function success(position) {
  let latitude = position.coords.latitude;
  let longitude = position.coords.longitude;

  fetch(
    `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=5`
  )
    .then((response) => response.json())
    .then((data) => {
      let timings = data.data.timings;
      let keys = Object.keys(timings);
      
      for (let i = 0; i < keys.length; i++) {
        let prayerTime = document.querySelector(`#${keys[i].toLowerCase()} time span`);
        if (prayerTime == null) {
          continue;
        }
        prayerTime.innerHTML = convertTo12Hours(timings[keys[i]]);
      }
      nextPrayer(timings , keys);

      // date section 
      // // malad date
      // --data.data.date.readable              this day in melad date
      // --data.data.date.hijri.weekday.ar      this day in week range

      let melad_box = document.querySelector(".melad-date time");
      melad_box.setAttribute("datetime",`${data.data.date.hijri.weekday.ar}__${data.data.date.readable}`)
      melad_box.innerHTML = `${data.data.date.gregorian.date}__${data.data.date.hijri.weekday.ar}`;
      
      // // hijri date 
      // --data.data.date.hijri.date            this day in hijri date
      // --data.data.date.hijri.month.ar        this month in higri date
      
      let higri_box = document.querySelector(".hegri-date time");
      higri_box.setAttribute("datetime",`${data.data.date.hijri.month.ar}__${data.data.date.hijri.date}`);
      higri_box.innerHTML = `${data.data.date.hijri.date}__${data.data.date.hijri.month.ar}`;

    }
  )

    .catch((error) => {
    swal("خطأ!", "حدثت مشكلة أثناء تحميل البيانات. حاول مرة أخرى.", "error");

    });
}
function error(errorMessage) {
    swal("!خطأ", ".تعذر تحديد موقعك. تأكد من تفعيل خدمة تحديد الموقع", "error");
}

function convertTo12Hours(time){
  time = time.split(":");

  if (+time[0] >12)
  {
    return `0${+time[0]-12}:${time[1]} PM`;
  }
  else if (+time[0] <12)
  {
    return `${time.join(":")} AM`;
  }
  else{
    return `${time.join(":")} PM`;
  }
}

// copy to clipbaord 

let copyMeladIcon = document.querySelector(".fa-copy-m");
let copyHijriIcon = document.querySelector(".fa-copy-h");

copyMeladIcon.onclick = function (e){

  let melad_box = document.querySelector(".melad-date time");

  navigator.clipboard.writeText(melad_box.innerHTML);
  setTimeout(() => {
  copyMeladIcon.classList.remove("fa-copy-m","fa-copy","fa-regular");
  copyMeladIcon.classList.add("fa-solid","fa-check");
    setTimeout(() => {
        copyMeladIcon.classList.remove("fa-solid","fa-check");
        copyMeladIcon.classList.add("fa-copy-m","fa-copy","fa-regular");
    }, 1000);
  }, 0);
}

copyHijriIcon.onclick = function (e){

  let higri_box = document.querySelector(".hegri-date time");

  navigator.clipboard.writeText(higri_box.innerHTML);

    setTimeout(() => {
  copyHijriIcon.classList.remove("fa-copy-m","fa-copy","fa-regular");
  copyHijriIcon.classList.add("fa-solid","fa-check");
    setTimeout(() => {
        copyHijriIcon.classList.remove("fa-solid","fa-check");
        copyHijriIcon.classList.add("fa-copy-m","fa-copy","fa-regular");
    }, 1000);
  }, 0);
}



// detremine the next prayer



function nextPrayer (timings , keys){
  let now = new Date();
  let smallDifference = Infinity , bigDifference = 0;
  let enArObjectForPrayers = {
    "Fajr": "الفجر",
    "Sunrise": "الشروق",
    "Dhuhr": "الظهر",
    "Asr": "العصر",
    "Maghrib": "المغرب",
    "Isha": "العشاء"
  };
  let nextPrayer , previousPrayer;
  let totalNowSeconds = new Date().getHours()*3600 +  new Date().getMinutes() * 60 + new Date().getSeconds();
  for (let i=0 ; i<keys.length ; i++)
  {
    timings[keys[i]] = timings[keys[i]].split(":");
    let prayerTime = document.querySelector(`#${keys[i].toLowerCase()} time span`);
    if (prayerTime == null) {
      continue;
    }
    let hours = +timings[keys[i]][0] * 3600 ;
    let minute =  +timings[keys[i]][1] * 60;
    let totalPrayerSeconds = hours + minute;
    let difference =totalPrayerSeconds  - totalNowSeconds;

    if (difference < 0) {
    difference += 24 * 3600; 
  }
    if (difference < smallDifference)
      {
      smallDifference = difference;
      nextPrayer = keys[i];
    }
    if (difference > bigDifference)
      {
        bigDifference = difference;
      previousPrayer = keys[i];
    }
  }
  if (!nextPrayer) nextPrayer = "Fajr";
  setActivePrayer(nextPrayer)
  let nextPrayerElement = document.querySelector(".inside-circle h3");
  nextPrayerElement.innerHTML = enArObjectForPrayers[nextPrayer];

  let p2 = document.querySelector(".a1 .p2 time");
  let p3 = document.querySelector(".a1 .p3 time");
  let span = document.querySelector(".a1 .p3 span");

  p3.innerHTML = convertTo12Hours(timings[previousPrayer].join(":"));
  p2.innerHTML = convertTo12Hours(timings[nextPrayer].join(":"));
  span.innerHTML = enArObjectForPrayers[previousPrayer]
  

  // The remaining time until the next prayer
  

  let theRemainingTimeUntilTheNextPrayer = document.querySelector(".a1 h3 time");
  setInterval(() => {
  let totalNowSeconds = new Date().getHours()*3600 +  new Date().getMinutes() * 60 + new Date().getSeconds();
    let hours = +timings[nextPrayer][0] * 3600 ;
    let minute =  +timings[nextPrayer][1] * 60;
    let totalPrayerSeconds = hours + minute;
    
    let difference =totalPrayerSeconds  - totalNowSeconds;

        if (difference < 0) {
    difference += 24 * 3600; 
  }
  let timeUntilTheNextPrayer = getTheRemainingTimeUntilTheNextPrayer(difference);
  // check if now is the time of prayer
  let arr = timeUntilTheNextPrayer.split(":");
  if (+arr[0]==0 && +arr[1]==0 && +arr[2]==0 ||
  (+arr[0]==23 && +arr[1]==59 && +arr[2]==59)){
    window.location.reload();
  }
  theRemainingTimeUntilTheNextPrayer.innerHTML = timeUntilTheNextPrayer;

  // progress 
    let prevPrayerHours = +timings[previousPrayer][0] * 3600 ;
    let prevPrayerminute =  +timings[previousPrayer][1] * 60;
    let totalPrevPrayerSeconds = prevPrayerHours + prevPrayerminute;
    let differenceBetweenNextAndPrevPrayer = totalPrayerSeconds - totalPrevPrayerSeconds;
    if (differenceBetweenNextAndPrevPrayer < 0) {
    differenceBetweenNextAndPrevPrayer += 24 * 3600; 
  }
  progress(100-(difference/differenceBetweenNextAndPrevPrayer)*100)
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
  
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function setActivePrayer(nextPrayer){
  // removeActiveFromElement
  let currentActive = document.querySelector(".active");
  currentActive.classList.remove("active");
  
  let addActiveToNextPrayer = document.querySelector(`#${nextPrayer.toLowerCase()}`);
  addActiveToNextPrayer.classList.add("active");
}



