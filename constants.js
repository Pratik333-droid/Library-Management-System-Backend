import { FineHistory } from "./models/fineHistoryModel.js"

export const DEADLINE = 90

export const BOOK_LIMIT_FOR_USERS = 5
export const BOOK_LIMIT_FOR_ADMINS = 8

//the following value is the total milliseconds in a single day
export const MS_PER_DAY = 86400000 
export const FINE_PER_DAY = 5

export async function appendFine(book_requests)
{
    var updated_requests = []
    for (const book_request of book_requests)
    {
        const issued_on = book_request.verified_on
        const to_be_returned_by = book_request.to_be_returned_by
        const user_id = book_request.user_id
        const book_id = book_request.book_id
        var fine_paid = 0
        const fine_record = await FineHistory.findOne({user_id: user_id, book_id: book_id})
        
        if (fine_record)
        fine_paid = fine_record.fine_paid

        let fine_charged = Math.ceil((new Date() - to_be_returned_by)/MS_PER_DAY)*FINE_PER_DAY
        if (fine_charged < 0)
        fine_charged = 0

        const fine_remaining = fine_charged - fine_paid

        const fine_object = {fine_charged: fine_charged, fine_paid: fine_paid, fine_remaining: fine_remaining}

        updated_requests.push({...book_request._doc, ...fine_object})
    }


    return updated_requests
}