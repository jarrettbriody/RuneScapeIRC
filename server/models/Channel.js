const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const _ = require('underscore');

let ChannelModel = {};

const convertId = mongoose.Types.ObjectId;
const setName = (name) => _.escape(name).trim();

const ChannelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    set: setName,
  },

  messages: [{
    username: {
      type: String,
      trim: true,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdDate: {
      type: String,
      required: true,
    },
  }],

  owner: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Account',
  },

  createdDate: {
    type: Date,
    default: Date.now,
  },
}, {
  usePushEach: true,
});

ChannelSchema.statics.toAPI = (doc) => ({
  name: doc.name,
});

ChannelSchema.statics.findByID = (channelID, callback) => {
  const search = {
    _id: convertId(channelID),
  };

  return ChannelModel.find(search).select('name messages').exec(callback);
};

ChannelSchema.statics.findByOwnerAndChannel = (ownerID, channelName, callback) => {
  const search = {
    owner: convertId(ownerID),
    name: channelName,
  };

  return ChannelModel.find(search).select('name messages').exec(callback);
};

ChannelSchema.statics.removeChannel = (ownerID, channelID, callback) => {
  const search = {
    owner: convertId(ownerID),
    _id: convertId(channelID),
  };

  return ChannelModel.deleteOne(search).exec(callback);
};

ChannelModel = mongoose.model('Channel', ChannelSchema);

module.exports.ChannelModel = ChannelModel;
module.exports.ChannelSchema = ChannelSchema;
