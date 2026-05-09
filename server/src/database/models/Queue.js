const mongoose = require('mongoose');
const { Schema } = mongoose;
const ConsultModel = require('./Consult');

const Queue = ConsultModel.discriminator('Queue',
    new Schema({
        TimeSeen: { type: Date, required: false },
    }, {discriminatorKey: 'type'})
);

module.exports = Queue;