const handleError = (message) => {
  $('#errorMessage').text(message);
  $('#errorContainer').animate({ width: 'toggle' }, 350);
};

const redirect = (response) => {
  $('#errorContainer').animate({ width: 'hide' }, 350);
  window.location = response.redirect;
};

const sendAjax = (type, action, data, success) => {
  // console.dir(action + " " + data);
  $.ajax({
    cache: false,
    type,
    url: action,
    data,
    dataType: 'json',
    success,
    error: (xhr, status, error) => {
      const messageObj = JSON.parse(xhr.responseText);
      handleError(messageObj.error);
    },
  });
};
