import mongoose from 'mongoose'

const historySchema = mongoose.Schema(
    {
        user_id : {type: String, required: true},
        book_id : {type: String, required: true},
        issued_on: {type: Date, required: true},
        to_be_returned_on: {type: Date, required: true},
        returned_on: {type: Date, default: Date.now, immutable: true},
        fine_charged : {type: Number, required: true},
    },
    {timestamps: true}
)

//this ensures that the record for the same book and the same user is not made twice.
historySchema.index({user_id: 1, book_id: 1}, {unique: true})
export const History = mongoose.model('History', historySchema)