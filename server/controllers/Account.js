const models = require('../models');
const Account = models.Account;

const loginPage = (req, res) => {
  res.render('login', { csrfToken: req.csrfToken() });
};

const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

/*
when logging in check that all values exist,
check if the user and pass are valid,
set session account var, redirect
*/
const login = (request, response) => {
  const req = request;
  const res = response;

  const username = `${req.body.username}`;
  const password = `${req.body.pass}`;

  if (!username || !password) {
    return res.status(400).json({ error: 'Both username and password fields are required.' });
  }

  return Account.AccountModel.authenticate(username, password, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Incorrect username or password.' });
    }

    req.session.account = Account.AccountModel.toAPI(account);

    return res.json({ redirect: '/tasks' });
  });
};

/*
when signing up check that all values exist,
create a new document with encrypted pass
*/
const signup = (request, response) => {
  const req = request;
  const res = response;

  req.body.username = `${req.body.username}`;
  req.body.pass = `${req.body.pass}`;
  req.body.pass2 = `${req.body.pass2}`;

  if (!req.body.username || !req.body.pass || !req.body.pass2) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (req.body.pass !== req.body.pass2) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }
  return Account.AccountModel.generateHash(req.body.pass, (salt, hash) => {
    const accountData = {
      username: req.body.username,
      salt,
      password: hash,
    };

    const newAccount = new Account.AccountModel(accountData);

    const savePromise = newAccount.save();

    savePromise.then(() => {
      req.session.account = Account.AccountModel.toAPI(newAccount);
      return res.json({ redirect: '/tasks' });
    });

    savePromise.catch((err) => {
      console.log(err);
      if (err.code === 11000) {
        return res.status(400).json({ error: 'Username already in use.' });
      }
      return res.status(400).json({ error: 'An error occurred.' });
    });
  });
};

/*
when changing passwords check that all values exist,
then check if the old password is correct,
then update the document with the new password after encryption
*/
const changePassword = (request, response) => {
  const req = request;
  const res = response;

  req.body.oldPass = `${req.body.oldPass}`;
  req.body.pass = `${req.body.pass}`;
  req.body.pass2 = `${req.body.pass2}`;

  if (!req.body.oldPass || !req.body.pass || !req.body.pass2) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  if (req.body.pass !== req.body.pass2) {
    return res.status(400).json({ error: 'Passwords do not match.' });
  }
  return Account.AccountModel.authenticate(
    req.session.account.username,
    req.body.oldPass,
    (err, account) => {
      if (err || !account) {
        return res.status(401).json({ error: 'Incorrect password.' });
      }
      return Account.AccountModel.generateHash(
      req.body.pass,
      (salt, hash) => Account.AccountModel.findByUsername(
        req.session.account.username,
        (err2, doc) => {
          if (err2) {
            console.log(err2);
            return res.status(400).json({ error: 'An error occurred' });
          }

          const updatedDoc = doc;

          updatedDoc.salt = salt;
          updatedDoc.password = hash;

          const savePromise = updatedDoc.save();

          savePromise.then(() => res.json({ redirect: '/tasks' }));

          savePromise.catch((err3) => {
            console.log(err3);
            return res.status(400).json({ error: 'An error occurred.' });
          });

          return savePromise;
        }));
    });
};

const getToken = (request, response) => {
  const req = request;
  const res = response;

  const csrfJSON = {
    csrfToken: req.csrfToken(),
  };

  res.json(csrfJSON);
};

module.exports.loginPage = loginPage;
module.exports.login = login;
module.exports.logout = logout;
module.exports.signup = signup;
module.exports.changePassword = changePassword;
module.exports.getToken = getToken;
