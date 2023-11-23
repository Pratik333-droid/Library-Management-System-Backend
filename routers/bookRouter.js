import express from 'express'
import { Books } from '../models/bookModel.js'

const router = express.Router()
router.use(express.json())

router.param('bookid', async function (req, res, next, bookid)
{
    try
    {
        const book = await Books.findById(bookid)
        console.log(`book = ${book}`)
        if(book)
        {
            req.book = book
            next()
        }
        else
        res.status(400).send({message: `No book found for the id ${bookid}`})
    }
    catch(err)
    {
        return res.status(400).send(err.message)
    }
})


router.post('/create', async function(req, res)
{

    if (!req.session.authorized)
    return res.status(401).send('Not authorized')

    try
    {
        if(req.body.title && req.body.author && req.body.published_year && req.body.category)
        {
            const new_book = {
                "title": req.body.title, 
                "author": req.body.author, 
                "category": req.body.category, 
                "quantity": req.body.quantity, 
                "only_for_admins": req.body.only_for_admins, 
                "published_year": req.body.published_year
            }
            const book = await Books.create(new_book)
            return res.status(200).send(book)

        }
        else
        return res.status(400).send({message: 'Enter all the necessary fields'})
    }

    catch(err)
    {
        return res.status(500).send({message: err.message})
    }

})

//when the admin tries to update the book info
router.put('/:bookid', async function(req, res)
{
    if (!req.session.authorized)
    res.status(401).send('Unauthorized! Only admins can update books.')

    try
    {
        if(req.body.title && req.body.author && req.body.published_year && req.body.category)
        {
            // const new_book = {"title": req.body.title, "author": req.body.author, "published_year": req.body.published_year}
            console.log(`req.body = ${req.body}`)
            //req.body = [object Object]
            console.log(`req.body = ${JSON.stringify(req.body)}`)
            // req.body = {"title":"Everything is F**ked","author":"Mark Manson","published_year":2012,"category":"self-help"}
            // const book = req.book
            await Books.findByIdAndUpdate(req.params.bookid, req.body)
            return res.status(200).send('book updated successfully')

        }
        else
        return res.status(400).send({message: 'Enter all the necessary fields'})
    }

    catch(err)
    {
        return res.status(500).send({message: err.message})
    }

})

//when an admin tries to delete the book
router.delete('/:bookid', async function(req, res)
{

    if(!req.session.authorized)
    return res.status(401).send('Unauthorized. Only admins can delete book records.')

    try
    {
        const deleted_book = await Books.findByIdAndDelete(req.params.bookid)
        if (deleted_book)
        return res.status(200).send({message: `Book with id ${req.params.bookid} deleted successfully.`})
        else
        return res.status(404).send({message: `Book with id ${req.params.bookid} is not found.`})

    }

    catch(err)
    {
        return res.status(500).send(err.message)
    }
})

//when anyone tries to view all the books available
router.get('/', async function(req, res)
{
    try
    {
        const books = await Books.find({})
        console.log(`books = ${books} and its type is ${typeof books}`)
        return res.status(200).json({length: books.length, data: books})

    }

    catch(err)
    {
        return res.status(500).send({message: err.message})
    }
})

router.get('/:bookid', async function(req, res)
{
    try
    {
        // const book = await Books.findById(req.params.bookid)
        console.log(`req.book = ${req.book}`)
        return res.status(200).json({book: req.book})
    }
    catch(err)
    {
        return res.status(500).send(err.message)
    }

})

export default router