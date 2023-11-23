import mongoose from 'mongoose'

const fineHistorySchema = mongoose.Schema(
    {
        user_id : {type: String, required: true},
        book_id : {type: String, required: true},
        fine_paid : {type: Number, required: true },
        paid_on : {type: Date, default: Date.now, immutable: true},
    },
    {timestamps: true}
)

//this ensures that fine is not recorded for the same book and the same user twice.
fineHistorySchema.index({user_id: 1, book_id: 1}, {unique: true})
export const FineHistory = mongoose.model('FineHistory', fineHistorySchema)