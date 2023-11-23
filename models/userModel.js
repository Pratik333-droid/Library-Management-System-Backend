import mongoose from 'mongoose'

const userSchema = mongoose.Schema(
    {
        full_name: {type: String, required: true},
        email: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        ph_no: {type: String, required: true, unique: true},
        is_admin: {type: Boolean, default: false},
        joined_on: {type: Date, default: Date.now, immutable: true},
        total_books_taken: {type: Number, default: 0}
    },
    {timestamp: true}
)

export const User = mongoose.model('User', userSchema)