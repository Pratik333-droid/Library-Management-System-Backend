import express from 'express'
import { BookRequests } from '../models/bookRequestModel.js'
import { Books } from '../models/bookModel.js'
import { User } from '../models/userModel.js'
import { History } from '../models/historyModel.js'
import { FineHistory } from '../models/fineHistoryModel.js'
import { DEADLINE, BOOK_LIMIT_FOR_ADMINS, BOOK_LIMIT_FOR_USERS, MS_PER_DAY, FINE_PER_DAY } from '../constants.js'
import { appendFine } from '../constants.js'

const router = express.Router()

router.use(express.json())


//when the admin views all the pending book requests
router.get('/pending-requests', async function(req, res)
{

    if (!req.session.user)
    return res.status(401).send('unauthorized access')
    //admins can view all the book requests while ordinary users can only view their requests.

    console.log(`req.session.user = ${req.session.user}`)
    console.log(`req.session.user._id = ${req.session.user._id}`)
    console.log(`req.session.user._id = ${req.session.user._id.toString()}`)

    console.log(`req.session.authorized = ${req.session.authorized}`)
    if (!req.session.authorized)
    {
        try
        {
            const book_requests = await BookRequests.find({is_verified: false, user_id: req.session.user._id})
            return res.status(200).send(book_requests)
    
        }
        catch(err)
        {
            return res.status(500).send(err.message)
        }

    }

    try
    {
        const user_id = req.body.user_id
        
        if (user_id)
        var book_requests = await BookRequests.find({is_verified: false, user_id: user_id})
        
        else
        var book_requests = await BookRequests.find({is_verified: false})
        
        return res.status(200).send(book_requests)

    }
    catch(err)
    {
        return res.status(500).send(err.message)
    }
})

//when the admin or the user views all the verified book requests. user can only view his requests that are verified
router.get('/verified-requests', async function(req, res)
{

    if (!req.session.user)
    return res.status(401).send('unauthorized access')
    //admins can view the book requests of all users while the ordinary users can view their own requests only.
    if (!req.session.authorized)
    {
        try
        {
            const book_requests = await BookRequests.find({is_verified: true, user_id: req.session.user._id})
            const updated_requests = await appendFine(book_requests)

            return res.status(200).send(updated_requests)
    
        }
        catch(err)
        {
            return res.status(500).send(err.message)
        }

    }


    try
    {
        const user_id = req.body.user_id
        
        if (user_id)
        var book_requests = await BookRequests.find({is_verified: true, user_id: user_id})
        
        else
        var book_requests = await BookRequests.find({is_verified: true})
        
        return res.status(200).send(book_requests)
        
    }
    catch(err)
    {
        return res.status(500).send(err.message)
    }
})

//when the admin verifies the requests
router.post('/verification', async function (req, res)
{
    if(!req.session.authorized)
    return res.status(401).send('Only admins can verify the requests.')

    
    try
    {
        const book_request = await BookRequests.findOne({user_id: req.body.user_id, book_id: req.body.book_id})

        if (book_request.is_verified)
        return res.status(400).send('That book request is already verified.')


        const deadline = new Date(new Date().setDate(new Date().getDate() + DEADLINE))
        await BookRequests.findOneAndUpdate({user_id: req.body.user_id, book_id: req.body.book_id}, {is_verified: true, verified_on: new Date(), to_be_returned_by: deadline})
        
        //increase the value of the total_books_taken_by_the_user by 1
        await User.findByIdAndUpdate(req.body.user_id, {$inc: {total_books_taken: 1}})
        return res.status(200).send('Verified Successfully')
    }

    catch(err)
    {
        return res.status(400).send(err.message)
    }
})

//when the user returns the book. The return of one book is recorded at a time. The recording is done by the admin/librarian.
router.post('/return', async function(req, res)
{
    if (!req.session.authorized)
    return res.status(401).send('unauthorized')

    try
    {

        const user_id = req.body.user_id
        const book_id = req.body.book_id
        const bookRequest = await BookRequests.findOne({user_id: user_id, book_id: book_id})
        
        if(!bookRequest)
        return res.status(400).send('User has not taken the book.')
        
        //check if the user has some fine to pay. use the same function to calc the fine amount in the frnt end as well
        let fine_charged = Math.ceil((new Date() - bookRequest.to_be_returned_by)/MS_PER_DAY)*FINE_PER_DAY
        
        if (fine_charged < 0)
        fine_charged = 0
        
        let fine_paid = 0
        
        //see if the user has already paid fine
        const fine_object = await FineHistory.findOne({user_id: user_id, book_id: book_id})
        
        if (fine_object)
        fine_paid = fine_object.fine_paid
    
        let fine_to_be_paid = fine_charged - fine_paid

        if (fine_to_be_paid > 0)
        return res.status(400).send('Clear the fine first to proceed further')
        

        //increase the book quantity by one and decrease the total books taken by the user by one
        await Books.findByIdAndUpdate(book_id, {$inc: {quantity: 1}})
        await User.findByIdAndUpdate(user_id, {$inc: {total_books_taken: -1}})

        //now delete the request from the bookrequest table and record it to transaction history table.
        await History.create({user_id: user_id, book_id: book_id, issued_on: bookRequest.verified_on, to_be_returned_on: bookRequest.to_be_returned_by, fine_charged: fine_paid})
        await BookRequests.findOneAndDelete({user_id: user_id, book_id: book_id})

        return res.status(200).send('Book returned successfully.')

    }

    catch(err)
    {
        return res.status(500).send(err.message)

    }
})

//admins can view the history of any user while the user can only view his history
router.get('/history', async function (req, res)
{
    
    if (req.session.authorized)
    {
        try
        {
            const user_id = req.body.user_id
            var history

            //when the admin views the history of a particular user
            if (user_id)
            history = await History.find({user_id: req.body.user_id})
        
            //when the admin views the history of all users
            else
            history = await History.find({})

            if (history)
            return res.status(200).send(history)

            else
            return res.status(400).send('No book history found for the user')

        }
        catch(err)
        {
            return res.status(500).send(err.message)
        }
    }

    //when the user(ordinary) requests for his history
    else if (req.session.user && !req.session.authorized)
    {

        const user_id = req.session.user._id
        const history = await History.find({user_id: user_id})

        if (history)
        return res.status(200).send(history)

        else
        return res.status(400).send('No history found.')

    }
})

router.param('bookid', async function (req, res, next, bookid)
{
    try
    {
        const book = await Books.findById(bookid)
        if (book)
        {
            req.book = book
            next()
        }
        else
        return res.status(400).send('Error')
    }
    catch(err)
    {
        return res.status(400).send(`error message = ${err.message}`)
    }
})

router.param('reqid', async function (req, res, next, reqid)
{
    try
    {
        const book_request = await BookRequests.findById(reqid)
        if (book_request)
        {
            req.book_request = book_request
            next()
        }
        else
        return res.status(500).send('Error')
    }
    catch(err)
    {
        return res.status(500).send(`error message = ${err.message}`)
    }
})


//when the user requests for the book.
router.post('/:bookid', async function (req, res)
{
    if (!req.session.user)
    return res.status(401).send('Please login to continue.')

    if (req.book.only_for_admins && !req.session.authorized)
    return res.status(401).send('The book is only available for the admins.')

    if (req.book.quantity < 1)
    return res.status(400).send('The book is out of stock.')

    const user = await User.findById(req.session.user._id)

    if((req.session.authorized && (user.total_books_taken >= BOOK_LIMIT_FOR_ADMINS )) || (!req.session.authorized && (user.total_books_taken >= BOOK_LIMIT_FOR_USERS)))
    return res.status(400).send('Max book limit reached.')

    
    try //trying to make a record in the bookrequest database
    {
        const book_request = new BookRequests({user_id: req.session.user._id, book_id: req.params.bookid})
        await book_request.save()

        //trying to increase the total_books_taken value of the user by 1
        await User.findByIdAndUpdate(req.session.user._id, {$inc: {total_books_taken: 1}})
        await Books.findByIdAndUpdate(req.params.bookid, {$inc: {quantity: -1}})
        
        return res.status(200).send(`Successfully requested for the book ${req.book.title}`)
    }
    catch(err)
    {
        console.log(`err = ${err}`)
        return res.status(500).send(err.message)
    }
})

//when the admin or a user views a particular book request. user can only view his request
router.get('/:reqid', async function(req, res)
{
    //admins can view all the book requests while the ordinary users can only view his book req.
    if ((!req.session.user) || (!req.session.authorized && (req.book_request.user_id !== req.session.user._id)))
    return res.status(401).send('Unauthorized')

    return res.status(200).send({request_details: req.book_request})
})

//when the admin or the user deletes the request made
router.delete('/:reqid', async function (req, res)
{
    if(!req.session.user)
    return res.status(401).send('Unauthorized user')

    //when an ordinary user tries to delete the request of other users.
    if(!req.session.authorized && (req.session.user._id !== req.book_request.user_id))
    return res.status(401).send('Unauthorized')

    if (req.book_request.is_verified)
    return res.status(400).send('Cant delete the verified requests.')

    try
    {
        
        await BookRequests.findByIdAndDelete(req.params.reqid)
        await Books.findByIdAndUpdate(req.book_request.book_id, {$inc: {quantity: 1}})
        return res.status(200).send('Request Deleted Successfully')
    }

    catch(err)
    {
        return res.status(400).send(err.message)
    }
})
export default router