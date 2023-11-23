import mongoose from 'mongoose'

const bookRequestSchema = mongoose.Schema(
    {
        user_id : {type: String, required: true},
        book_id : {type: String, required: true},
        requested_on : {type: Date, default: Date.now, immutable: true },
        is_verified: {type: Boolean, default: false},
        verified_on : {type: Date},
        to_be_returned_by : {type: Date}
    },
    {timestamps: true}
)

//this ensures that user barambar do not request for the same book.
bookRequestSchema.index({user_id: 1, book_id: 1}, {unique: true})
export const BookRequests = mongoose.model('BookRequests', bookRequestSchema)