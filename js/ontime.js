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

$(document).ready(() => {
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
          clickFromTimeTable();
          break;

        case 2:
          step = 3;
          adjustTimeAndSave();
          break;

        case 3:
          step = 4;
          leaveProcess('done');
          $(timoIframe).attr('src', `${rootUrl}${timoUrl}?action=1`);
          break;
      }
    });
    $('body').loading({
      onStart: function(loading) {
        loading.overlay.slideDown(500);
      },
      onStop: function(loading) {
        loading.overlay.slideUp(500);
      },
      message: 'TimO - on time processing...',
      theme: 'dark',
    });
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
        return getTimeTableCell(tableIframe);
      }
    })
    .then((timeCell) => {
      if (timeCell) {
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
        const now = new Date();
        $(timeInput).val(`${now.getHours()}:${now.getMinutes()}`);
        $(saveButton).trigger('click');
      } else {
        leaveProcess('error: time input / save button not found');
      }
    });
}

function leaveProcess(message) {
  $('div.loading-overlay-content').html(message);
  $(timoIframe).off('load');
  setTimeout(() => {
    $('body').loading('stop');
  }, 1000);
  setTimeout(() => {
    $('body').loading('destroy');
  }, 2000);
}
