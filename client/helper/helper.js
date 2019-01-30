const handleError = (message) => {
  console.dir(message);
  document.querySelector('#errorMessage').innerHTML = message;
  // $('#errorContainer').animate({ display: 'block' }, 350);
  document.querySelector('#errorContainer').style.display = 'block';
};

const redirect = (response) => {
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
    success: (data2, status, xhr) => {
      // console.dir(data2);
      // console.dir(status);
      // console.dir(xhr);
      success(data2, status, xhr);
      if (data2.message) {
        // console.dir(data2.message);
        handleError(data2.message);
      }
    },
    error: (xhr, status, error) => {
      const messageObj = JSON.parse(xhr.responseText);
      handleError(messageObj.error);
      // console.dir(messageObj);
    },
  });
};
