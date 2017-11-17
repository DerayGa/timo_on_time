const rootUrl = 'https://www1.meteocontrol.de/timo/';
const timoUrl = 'actions/zeiterfassung_industrie/zeiterfassung_industrie_action.jsp';
const tableIframeSrc = 'zeiterfassung_low.jsp'
const startWorkImg = '../../images/kommen.gif';
const endWorkImg = '../../images/gehen.gif';
//const endWorkImg = '../../images/kommen_gehen_grau.gif';

let retry = 30;
const timer = 500;

let MODE = 'start'; //'end'
$(document).ready(() => {
  console.log('TimO on time activated');
  getRootIframe()
    .then((rootIframe) => {
      if (rootIframe) {
        return checkMode(rootIframe);
      }
    }).then((values) => {
      if (values.length) {
        MODE = values[1];
        hijack(values[0]);
      }
    })
});

function hijack(targetButton) {
  if (!targetButton.length) return;

  const imgSrc = MODE === 'start' ? startWorkImg : endWorkImg;
  const fakeButton = $(`<img src='${imgSrc}' alt='Timo on itme' title='Timo on time'>`);
  $(fakeButton).insertAfter($(targetButton));
  $(targetButton).hide();

  $(fakeButton).click(() => {
    $('body').loading({
      message: 'TimO - on time processing...'
    });
    const shadowIframe = $('<iframe />', {
      style: 'width:1px;height:1px',
      src: `${timoUrl}?action=1`
    })
    let step = 1;
    $(shadowIframe).load(() => {
      switch (step) {
        case 1:
          console.log('step 1');
          step = 2;
          if (MODE === 'start') {
            triggerStartWork(shadowIframe);
          } else {
            triggerEndWork(shadowIframe);
          }
          break;

        case 2:
          console.log('step 2');
          step = 3;
          clickFromTimeTable(shadowIframe);
          break;

        case 3:
          console.log('step 3');
          step = 4;
          adjustTimeAndSave(shadowIframe);
          break;

        case 4:
          location.reload();
          break;
      }
    });
    shadowIframe.appendTo('body');
  });
}

function getRootIframe(resolve) {
  if (!resolve) {
    return new Promise((resolve) => {
      getRootIframe(resolve);
    });
  }
  const rootIframe = $(`iframe[src="${timoUrl}?action=1"]`);
  if (retry < 0) {
    resolve();
    return;
  }
  if (rootIframe.length) {
    resolve(rootIframe);
  } else {
    setTimeout(function() {
      retry--;
      getRootIframe(resolve);
    }, timer);
  }
}

function checkMode(rootIframe, resolve) {
  if (!resolve) {
    return new Promise((resolve) => {
      checkMode(rootIframe, resolve);
    });
  }
  const startWorkButton = $(`img[src="${startWorkImg}"]`, rootIframe.contents());
  const endWorkButton = $(`img[src="${endWorkImg}"]`, rootIframe.contents());

  if (retry < 0) {
    resolve();
    return;
  }

  if (startWorkButton.length) {
    resolve([$(startWorkButton[0]), 'start']);
  } else if (endWorkButton.length) {
    resolve([$(endWorkButton[0]), 'end']);
  } else {
    setTimeout(function() {
      retry--;
      checkMode(rootIframe, resolve);
    }, timer);
  }
}

function getStartWorkButton(rootIframe, resolve) {
  if (!resolve) {
    return new Promise((resolve) => {
      getStartWorkButton(rootIframe, resolve);
    });
  }
  const startWorkButton = $(`img[src="${startWorkImg}"]`, rootIframe.contents());

  if (retry < 0) {
    resolve();
    return;
  }

  if (startWorkButton.length) {
    resolve($(startWorkButton[0]));
  } else {
    setTimeout(function() {
      retry--;
      getStartWorkButton(rootIframe, resolve);
    }, timer);
  }
}

function getEndWorkButton(rootIframe, resolve) {
  if (!resolve) {
    return new Promise((resolve) => {
      getEndWorkButton(rootIframe, resolve);
    });
  }
  const endWorkButton = $(`img[src="${endWorkImg}"]`, rootIframe.contents());

  if (retry < 0) {
    resolve();
    return;
  }

  if (endWorkButton.length) {
    resolve($(endWorkButton[0]));
  } else {
    setTimeout(function() {
      retry--;
      getEndWorkButton(rootIframe, resolve);
    }, timer);
  }
}

function getTableIframe(rootIframe, resolve) {
  if (!resolve) {
    return new Promise((resolve) => {
      getTableIframe(rootIframe, resolve);
    });
  }
  const tableIframe = $(`iframe`, rootIframe.contents());
  if (retry < 0) {
    resolve();
    return;
  }
  if (tableIframe.length) {
    resolve($(tableIframe[0]));
  } else {
    setTimeout(function() {
      retry--;
      getTableIframe(rootIframe, resolve);
    }, timer);
  }
}

function getTimeTable(rootIframe, resolve) {
  if (!resolve) {
    return new Promise((resolve) => {
      getTimeTable(rootIframe, resolve);
    });
  }
  const startWorkButton = $(`img[src="${startWorkImg}"]`, rootIframe.contents());

  if (retry < 0) {
    resolve();
    return;
  }

  if (startWorkButton.length) {
    resolve(startWorkButton);
  } else {
    setTimeout(function() {
      retry--;
      getTimeTable(rootIframe, resolve);
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
    const timetable = tables[1];
    const trs = $('tr', timetable);

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

function getTimeInput(rootIframe, resolve) {
  if (!resolve) {
    return new Promise((resolve) => {
      getTimeInput(rootIframe, resolve);
    });
  }
  const timeInput = $('input[type="text"][name="buchung_zeit"]', rootIframe.contents());

  if (retry < 0) {
    resolve();
    return;
  }

  if (timeInput.length) {
    resolve(timeInput);
  } else {
    setTimeout(function() {
      retry--;
      getTimeInput(rootIframe, resolve);
    }, timer);
  }
}
function getSaveButton(rootIframe, resolve) {
  if (!resolve) {
    return new Promise((resolve) => {
      getSaveButton(rootIframe, resolve);
    });
  }
  const saveButton = $('input[type="button"]', rootIframe.contents())

  if (retry < 0) {
    resolve();
    return;
  }

  if (saveButton.length) {
    resolve(saveButton);
  } else {
    setTimeout(function() {
      retry--;
      getSaveButton(rootIframe, resolve);
    }, timer);
  }
}

// step 1
function triggerStartWork(shadowIframe) {

  getStartWorkButton(shadowIframe)
    .then((targetButton) => {
      if (targetButton) {
        console.log('automatic click start work')
        $(targetButton).trigger('click');
      } else {
        console.log('triggerStartWork not found');
      }
    });
}

// step 1
function triggerEndWork(shadowIframe) {
  getEndWorkButton(shadowIframe)
    .then((targetButton) => {
      if (targetButton) {
        console.log('automatic click end work')
        $(targetButton).trigger('click');
      } else {
        console.log('triggerEndWork not found');
      }
    });
}

// step 2
function clickFromTimeTable(shadowIframe) {
  getTableIframe(shadowIframe)
    .then((tableIframe) => {
      if (tableIframe) {
        return getTimeTableCell(tableIframe);
      }
    })
    .then((timeCell) => {
      if (timeCell) {
        const loadKGStr = $(timeCell).attr('onclick');
        const id = loadKGStr.substring(loadKGStr.indexOf('(') + 1, loadKGStr.indexOf(')'))
        console.log('automatic click edit time ', id)
        $(shadowIframe).attr('src', `${rootUrl}${timoUrl}?action=21&arbeitstyp=5&buchung_id=${id}`);
      } else {
        console.log('clickFromTimeTable not found')
      }
    });
}

// step 3
function adjustTimeAndSave(shadowIframe) {
  getTimeInput(shadowIframe)
    .then((timeInput) => {
      if (timeInput) {
        const now = new Date();
        $(timeInput).val(`${now.getHours()}:${now.getMinutes()}`);

        getSaveButton(shadowIframe)
          .then((saveButton) => {
            if (saveButton) {
              $(saveButton).trigger('click');
            } else {
              console.log('saveRecord not found');
            }
          });
      } else {
        console.log('adjustTime not found');
      }
    });
}
