const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
// const _ = require('underscore');

let AccountChannelPairModel = {};

const convertId = mongoose.Types.ObjectId;
// const setName = (name) => _.escape(name).trim();

const AccountChannelPairSchema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Account',
  },

  channelID: {
    type: mongoose.Schema.ObjectId,
    required: true,
  },

  accepted: {
    type: Boolean,
    default: false,
  },

  owner: {
    type: Boolean,
    default: false,
  },

  createdDate: {
    type: Date,
    default: Date.now,
  },
});

AccountChannelPairSchema.statics.toAPI = (doc) => ({
  userID: doc.userID,
  channelID: doc.channelID,
  owner: doc.owner,
  accepted: doc.accepted,
});

AccountChannelPairSchema.statics.findByUserID = (userID, callback) => {
  const search = {
    userID: convertId(userID),
  };
  const doc = AccountChannelPairModel.find(search);
  return doc.select('userID channelID owner accepted').exec(callback);
};

AccountChannelPairSchema.statics.findByUserAndChannel = (userID, channelID, callback) => {
  const search = {
    userID: convertId(userID),
    channelID: convertId(channelID),
  };
  const doc = AccountChannelPairModel.find(search);
  return doc.select('userID channelID owner accepted').exec(callback);
};

AccountChannelPairSchema.statics.remove = (userID, channelID, callback) => {
  const search = {
    userID: convertId(userID),
    channelID: convertId(channelID),
  };

  return AccountChannelPairModel.deleteOne(search).exec(callback);
};

AccountChannelPairSchema.statics.removeAllOfChannel = (channelID, callback) => {
  const search = {
    channelID: convertId(channelID),
  };

  return AccountChannelPairModel.deleteMany(search).exec(callback);
};

AccountChannelPairModel = mongoose.model('AccountChannelPair', AccountChannelPairSchema);

module.exports.AccountChannelPairModel = AccountChannelPairModel;
module.exports.AccountChannelPairSchema = AccountChannelPairSchema;
