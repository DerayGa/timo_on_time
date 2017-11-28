const rootUrl = 'https://www1.meteocontrol.de/timo/';
const timoUrl = 'actions/zeiterfassung_industrie/zeiterfassung_industrie_action.jsp';
const tableIframeSrc = 'zeiterfassung_low.jsp'
const startWorkImg = '../../images/kommen.gif';
const endWorkImg = '../../images/gehen.gif';
const greyImg = '../../images/kommen_gehen_grau.gif';

const timer = 100;
let retry = 150;
let timoIframe;
let step = 1;
let loadingGif;
let progressBar;

$(document).ready(() => {
  const date = new Date();
  if (date.toLocaleString('en', { timeZone: "Europe/Berlin" }) == date.toLocaleString('en')) {
    return;
  }
  console.log('TimO - on time activated');

  getRootIframe()
    .then(() => {
      if (!timoIframe) return;

      $(timoIframe).on('load', () => {
        $(timoIframe).off('load');
        getTargetButon()
          .then((targetButton) => {
            hijack(targetButton);
          });
      });
    });
});

function hijack(targetButton) {
  if (!targetButton) return;

  $(targetButton).attr('title', 'Timo on time');

  $(targetButton).click(() => {
    $(timoIframe).on('load', () => {
      switch (step) {
        case 1:
          step = 2;
          progressBar.animate(0.25);
          clickFromTimeTable();
          break;

        case 2:
          step = 3;
          progressBar.animate(0.7);
          adjustTimeAndSave();
          break;

        case 3:
          step = 4;
          progressBar.animate(1.0);
          leaveProcess('Done');
          $(timoIframe).attr('src', `${rootUrl}${timoUrl}?action=1`);
          break;
      }
    });

    const offset = $(timoIframe).offset() || { top : 0 };
    loadingGif = $(`<div class="ontime loading" style="top:${offset.top}px;"><img src=${chrome.extension.getURL('assets/loading.gif')}><div id="progress" /></div>`);
    $('body').append(loadingGif);
    $(loadingGif).fadeIn(500);
    progressBar = new ProgressBar.Circle($('div#progress', loadingGif)[0], {
      strokeWidth: 2,
      easing: 'easeInOut',
      duration: 750,
      color: '#FE8341',
      trailColor: '#3E3A61',
      from: {color: '#3E3A61'},
      to: {color: '#FE8341'},
      step: (state, circle) => {
        circle.path.setAttribute('stroke', state.color);
      },
      trailWidth: 1,
      svgStyle: null
    });

    progressBar.animate(0.15);
  });
}

function getRootIframe(resolve) {
  if (!resolve) {
    return new Promise((resolve) => {
      getRootIframe(resolve);
    });
  }
  timoIframe = $(`iframe[src="${timoUrl}?action=1"]`);
  if (retry < 0) {
    resolve();
    return;
  }
  if (timoIframe.length) {
    resolve();
  } else {
    setTimeout(function() {
      retry--;
      getRootIframe(resolve);
    }, timer);
  }
}

function getTargetButon(resolve) {
  if (!resolve) {
    return new Promise((resolve) => {
      getTargetButon(resolve);
    });
  }
  const startWorkButton = $(`img[src="${startWorkImg}"]`, timoIframe.contents());
  const endWorkButton = $(`img[src="${endWorkImg}"]`, timoIframe.contents());
  const greyButton = $(`img[src="${greyImg}"]`, timoIframe.contents());

  if (retry < 0) {
    resolve();
    return;
  }

  if (startWorkButton.length) {
    resolve($(startWorkButton[0]));
  } else if (endWorkButton.length) {
    resolve($(endWorkButton[0]));
  } else if (greyButton.length) {
    resolve();
  } else {
    setTimeout(function() {
      retry--;
      getTargetButon(resolve);
    }, timer);
  }
}

function getTableIframe(resolve) {
  if (!resolve) {
    return new Promise((resolve) => {
      getTableIframe(resolve);
    });
  }
  const tableIframe = $(`iframe`, timoIframe.contents());
  if (retry < 0) {
    resolve();
    return;
  }
  if (tableIframe.length) {
    resolve($(tableIframe[0]));
  } else {
    setTimeout(function() {
      retry--;
      getTableIframe(resolve);
    }, timer);
  }
}

function getTimeTableCell(tableIframe, resolve) {
  if (!resolve) {
    return new Promise((resolve) => {
      getTimeTableCell(tableIframe, resolve);
    });
  }
  let timeCell = [];
  const tables = $('table', $(tableIframe).contents())
  if (tables.length) {
    const trs = $('tr', tables[1]);

    if (trs.length) {
      const tds = $('td', trs[1]);

      if (tds.length) {
        timeCell = $('a', tds[2]);
      }
    }
  }
  if (retry < 0) {
    resolve();
    return;
  }

  if (timeCell.length) {
    resolve($(timeCell[0]));
  } else {
    setTimeout(function() {
      retry--;
      getTimeTableCell(tableIframe, resolve);
    }, timer);
  }
}

function getTimeInputAndSaveButton(resolve) {
  if (!resolve) {
    return new Promise((resolve) => {
      getTimeInputAndSaveButton(resolve);
    });
  }
  const timeInput = $('input[type="text"][name="buchung_zeit"]', timoIframe.contents());
  const saveButton = $('input[type="button"]', timoIframe.contents());
  if (retry < 0) {
    resolve([]);
    return;
  }

  if (timeInput.length && saveButton.length) {
    resolve([timeInput, saveButton]);
  } else {
    setTimeout(function() {
      retry--;
      getTimeInputAndSaveButton(resolve);
    }, timer);
  }
}

// step 1
function clickFromTimeTable() {
  getTableIframe()
    .then((tableIframe) => {
      if (tableIframe) {
        progressBar.animate(0.35);
        return getTimeTableCell(tableIframe);
      }
    })
    .then((timeCell) => {
      if (timeCell) {
        progressBar.animate(0.5);
        const loadIdStr = $(timeCell).attr('onclick');
        const id = loadIdStr.substring(loadIdStr.indexOf('(') + 1, loadIdStr.indexOf(')'));
        $(timoIframe).attr('src', `${rootUrl}${timoUrl}?action=21&arbeitstyp=5&buchung_id=${id}`);
      } else {
        leaveProcess('error: timeCell not found');
      }
    });
}

// step 2
function adjustTimeAndSave() {
  getTimeInputAndSaveButton()
    .then(([timeInput, saveButton]) => {
      if (timeInput && saveButton) {
        progressBar.animate(0.85);
        const now = new Date();
        $(timeInput).val(`${now.getHours()}:${now.getMinutes()}`);
        $(saveButton).trigger('click');
      } else {
        leaveProcess('error: time input / save button not found');
      }
    });
}

function leaveProcess(message) {
  $(timoIframe).off('load');

  $(loadingGif).fadeOut(2000);
  setTimeout(() => {
    $(loadingGif).remove();
  }, 2100);
}
