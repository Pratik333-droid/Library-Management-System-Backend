import mongoose from 'mongoose'

const bookSchema = mongoose.Schema(
    {
        title: {type: String, required: true},
        author: {type: String, required: true},
        category: {type: String, default: 'General'},
        quantity: {type: Number, default: 1},
        only_for_admins: {type: Boolean, default: false},
        published_year: {type: Number, required: true}
    },
    {timestamps: true}
)

export const Books = mongoose.model('books', bookSchema) 