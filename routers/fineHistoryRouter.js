import express from 'express'
import { FineHistory } from '../models/fineHistoryModel.js'
import { BookRequests } from '../models/bookRequestModel.js'

const router = express.Router()
router.use(express.json())

//when the admin records the fine paid by the user.
router.post('/', async function(req, res)
{
    //the record of fine payment can only be made by the admin
    if (!req.session.authorized)
    return res.status(401).send('unauthorized')

    try
    {
        const user_id = req.body.user_id
        const book_id = req.body.book_id
        const fine_amount = req.body.fine_amount

        if (!user_id || !book_id || !fine_amount)
        return res.status(400).send('Enter user id and book id and the fine amount in the request body')

        const book_request = BookRequests.findOne({user_id: user_id, book_id: book_id})
        
        if (!book_request)
        return res.status(400).send('User has not taken the book.')

        //if the user has already paid the fine partially for that particular book and is paying it again.
        const updated_fine_doc = await FineHistory.findOneAndUpdate({user_id: user_id, book_id: book_id}, {$inc: {fine_paid: fine_amount}}, {new: true})

        //if the user is paying the fine for the first time for a particular book
        if (!updated_fine_doc)
        await FineHistory.create({user_id: user_id, book_id: book_id, fine_paid: fine_amount})

        return res.status(200).send('Payment of fine recorded successfully.')
        
    }
    catch(err)
    {
        return res.status(500).send(err.message)
    }
    
})
export default router