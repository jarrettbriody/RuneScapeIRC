const models = require('../models');

const Channel = models.Channel;
const Account = models.Account;
const AccountChannelPair = models.AccountChannelPair;

const channelConnections = {};

// create channel list
const createChannelListPage = (req, res) => {
  AccountChannelPair.AccountChannelPairModel.findByUserID(req.session.account._id, (err, docs) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }
    const channelDocArray = [];
    docs.forEach((pairDoc) => {
      if (pairDoc.accepted) {
        Channel.ChannelModel.findByID(pairDoc.channelID, (err2, channelDoc) => {
          if (err2) {
            console.log(err2);
            return res.status(400).json({ error: 'An error occurred' });
          }
          return channelDocArray.push({ name: channelDoc.name, _id: channelDoc._id });
        });
      }
    });
    return res.render('dashboard', { csrfToken: req.csrfToken(), channels: channelDocArray });
  });
};

/*
create a new channel document then save it
*/
const createChannel = (req, res) => {
  if (!req.body.name) {
    return res.status(400).json({ error: 'Channel name is required.' });
  }

  return Channel.ChannelModel.findByOwnerAndChannel(
    req.session.account._id,
    req.body.name,
    (err, docs) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: 'An error occurred' });
      }
      if (docs.length > 0) {
        return res.status(400).json({ error: 'You already own a channel with this name.' });
      }

      const channelData = {
        name: req.body.name,
        owner: req.session.account._id,
      };

      const newChannel = new Channel.ChannelModel(channelData);

      const channelPromise = newChannel.save();

      channelPromise.then(() => {
        const accountChannelPairData = {
          userID: req.session.account._id,
          channelID: newChannel._id,
          owner: true,
          accepted: true,
        };

        const newAccountChannelPair = new AccountChannelPair.AccountChannelPairModel(
          accountChannelPairData);

        const accountChannelPairPromise = newAccountChannelPair.save();

        accountChannelPairPromise.then(() => res.json({ message: 'Creation successful.' }));

        accountChannelPairPromise.catch((err2) => {
          console.log(err2);
          return res.status(400).json({ error: 'An error occurred' });
        });
      });

      channelPromise.catch((err2) => {
        console.log(err2);
        return res.status(400).json({ error: 'An error occurred' });
      });

      return channelPromise;
    });
};

// invite a user to a specified channel
const inviteUser = (req, res) => {
  if (!req.body.username) {
    return res.status(400).json({ error: 'Username is required.' });
  }

  return Account.AccountModel.findByUsername(
    req.body.username,
    (err, docs) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: 'An error occurred' });
      }
      if (!docs) {
        return res.status(400).json({ error: 'User does not exist.' });
      }
      if (docs._id.toString() === req.session.account._id) {
        return res.status(400).json(
          { error: 'You cannot add yourself to a channel you are a part of.' }
        );
      }

      return AccountChannelPair.AccountChannelPairModel.findByUserAndChannel(
        docs._id,
        req.body.channelID,
        (err2, docs2) => {
          if (err2) {
            console.log(err2);
            return res.status(400).json({ error: 'An error occurred' });
          }
          if (docs2.length > 0) {
            return res.status(400).json({
              error: 'User has already been invited to this channel.',
            });
          }

          const accountChannelPairData = {
            userID: docs._id,
            channelID: req.body.channelID,
            owner: false,
            accepted: false,
          };

          const newAccountChannelPair = new AccountChannelPair.AccountChannelPairModel(
            accountChannelPairData);

          const accountChannelPairPromise = newAccountChannelPair.save();

          accountChannelPairPromise.then(() => res.status(200).json({
            message: 'Invite successful.',
          }));

          accountChannelPairPromise.catch((err3) => {
            console.log(err3);
            return res.status(400).json({ error: 'An error occurred' });
          });

          return accountChannelPairPromise;
        }
      );
    });
};

// handle user response to some invite, accept/decline
const inviteResponse = (req, res) => {
  if (req.body.accepted === 'true') {
    return AccountChannelPair.AccountChannelPairModel.findByUserAndChannel(
      req.session.account._id,
      req.body.channelID,
      (err, docs) => {
        if (err) {
          console.log(err);
          return res.status(400).json({ error: 'An error occurred' });
        }

        const updatedDoc = docs[0];

        updatedDoc.accepted = true;

        const updateInvitePromise = updatedDoc.save();

        updateInvitePromise.then(() => {
          res.status(200).json({ message: 'Invite accepted.' });
        });

        updateInvitePromise.catch((err2) => {
          console.log(err2);
        });

        return updateInvitePromise;
      });
  } else if (req.body.accepted === 'false') {
    return AccountChannelPair.AccountChannelPairModel.remove(
      req.session.account._id,
      req.body.channelID,
      (err) => {
        if (err) {
          console.log(err);
          return res.status(400).json({ error: 'An error occurred' });
        }
        return res.status(200).json({ message: 'Invite declined.' });
      }
    );
  }
  return res.status(400).json({ error: 'An error occurred' });
};

/*
get all channels by some account id then return them
*/
const getChannels = (request, response) => {
  const req = request;
  const res = response;

  AccountChannelPair.AccountChannelPairModel.findByUserID(req.session.account._id, (err, docs) => {
    // console.dir(docs);
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }

    if (docs.length === 0) return res.status(200).json({ channels: [] });

    const channelArrayPromise = new Promise((resolve, reject) => {
      const channelDocArray = [];
      for (let i = 0; i < docs.length; i++) {
        Channel.ChannelModel.findByID(docs[i].channelID, (err2, channelDoc) => {
          if (err2) {
            console.log(err2);
            reject(err2);
            return res.status(400).json({ error: 'An error occurred' });
          }

          const newPair = {
            name: channelDoc[0].name,
            accepted: docs[i].accepted,
            owner: docs[i].owner,
            _id: channelDoc[0]._id,
          };

          channelDocArray.push(newPair);

          if (channelDocArray.length === docs.length) resolve(channelDocArray);

          return channelDocArray;
        });
      }
    });

    channelArrayPromise.then((result) => {
      // console.dir(result);
      res.json({ channels: result });
    });

    return channelArrayPromise;
  });
};

/*
delete a channel then notify all sockets that the channel
was deleted
*/
const removeChannel = (request, response) => {
  const req = request;
  const res = response;
  return Channel.ChannelModel.removeChannel(
    req.session.account._id,
    req.body.channelID,
    (err) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: 'An error occurred' });
      }
      return AccountChannelPair.AccountChannelPairModel.removeAllOfChannel(
        req.body.channelID,
        (err2) => {
          if (err2) {
            console.log(err);
            return res.status(400).json({ error: 'An error occurred' });
          }
          if (channelConnections[req.body.channelID]) {
            for (let i = 0; i < channelConnections[req.body.channelID].length; i++) {
              channelConnections[req.body.channelID][i].send(JSON.stringify(
                {
                  action: 'CHANNEL_DELETED',
                  channelID: req.body.channelID,
                }
              ));
            }
          }
          if (req.body.channelID !== '' && channelConnections[req.body.channelID]) {
            delete channelConnections[req.body.channelID];
          }
          return res.status(200).json({ message: 'Deletion successful.' });
        }
      );
    }
  );
};

// leave a channel user does not own
const leaveChannel = (request, response) => {
  const req = request;
  const res = response;
  return AccountChannelPair.AccountChannelPairModel.remove(
    req.session.account._id,
    req.body.channelID,
    (err2) => {
      if (err2) {
        console.log(err2);
        return res.status(400).json({ error: 'An error occurred' });
      }
      return res.status(200).json({ message: 'Channel successfully left.' });
    }
  );
};

/*
record ws message a user sent to the database, send message
via websockets to all connected users in that channel
*/
const addChannelMessage = (messageJSON) => {
  for (let i = 0; i < channelConnections[messageJSON.channelID].length; i++) {
    // console.dir(channelConnections[messageJSON.channelID][i]);
    channelConnections[messageJSON.channelID][i].send(JSON.stringify(messageJSON));
  }
  Channel.ChannelModel.findByID(
    messageJSON.channelID,
    (err, doc) => {
      if (err) {
        console.log(err);
      }

      const newMessage = {
        username: messageJSON.username,
        content: messageJSON.content,
        createdDate: messageJSON.createdDate,
      };

      const updatedDoc = doc[0];

      updatedDoc.messages.push(newMessage);

      const updateChannelPromise = updatedDoc.save();

      updateChannelPromise.then();

      updateChannelPromise.catch((err2) => {
        console.log(err2);
      });

      return updateChannelPromise;
    }
  );
};

// swap the channel the websocket is currently connected to
const swapConnectionChannel = (oldChannelID, newChannelID, ws) => {
  // swap clients channel
  if (oldChannelID !== '' && channelConnections[oldChannelID]) {
    const clientIndex = channelConnections[oldChannelID].indexOf(ws);
    channelConnections[oldChannelID].splice(clientIndex, 1);
  }
  if (channelConnections[newChannelID]) {
    channelConnections[newChannelID].push(ws);
  } else {
    channelConnections[newChannelID] = [ws];
  }
};

// remove the websocket from the dictionary when user closes window
const endConnection = (channelID, ws) => {
  if (channelID !== '' && channelConnections[channelID]) {
    const clientIndex = channelConnections[channelID].indexOf(ws);
    channelConnections[channelID].splice(clientIndex, 1);
  }
};

// get an individual channel and return it
const getSingleChannel = (request, response) => {
  const req = request;
  const res = response;
  Channel.ChannelModel.findByID(
    req.body.channelID,
    (err, doc) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: 'Channel does not exist.' });
      }
      // request.session.currentCharacter = doc;
      res.cookie('currentChannel', doc);
      return res.json({ channel: doc });
    });
};


module.exports.createChannelListPage = createChannelListPage;
module.exports.createChannel = createChannel;
module.exports.removeChannel = removeChannel;
module.exports.leaveChannel = leaveChannel;
module.exports.inviteUser = inviteUser;
module.exports.inviteResponse = inviteResponse;
module.exports.getChannels = getChannels;
module.exports.getSingleChannel = getSingleChannel;
module.exports.addChannelMessage = addChannelMessage;
module.exports.swapConnectionChannel = swapConnectionChannel;
module.exports.endConnection = endConnection;
