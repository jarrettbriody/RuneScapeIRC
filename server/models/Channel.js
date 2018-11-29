const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const _ = require('underscore');

let ChannelModel = {};

// const convertId = mongoose.Types.ObjectId;
const setName = (name) => _.escape(name).trim();

const ChannelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    set: setName,
  },

  messages: {
    type: Array,
    default: [],
  },

  owner: {
    type: mongoose.Schema.ObjectId,
    required: true,
    ref: 'Account',
  },

  createdDate: {
    type: Date,
    default: Date.now,
  },
});

ChannelSchema.statics.toAPI = (doc) => ({
  name: doc.name,
});

ChannelSchema.statics.findByID = (_id, callback) => {
  const search = {
    _id,
  };

  return ChannelModel.find(search).select('name messages').exec(callback);
};

ChannelSchema.statics.removeChannel = (ownerId, _id, callback) => {
  const search = {
    owner: convertId(ownerId),
    _id,
  };

  return ChannelModel.deleteOne(search).exec(callback);
};

ChannelModel = mongoose.model('Channel', ChannelSchema);

module.exports.ChannelModel = ChannelModel;
module.exports.ChannelSchema = ChannelSchema;
