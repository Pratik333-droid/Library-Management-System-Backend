# Library Management System

### Functional requirements

************System************

1. Books should be distributed in the first request first serve basis.
2. If the user has to pay fine, he/she can only return the book once the fine is paid.
3. When the user returns the book, the record from BookRequest should be moved to History. This can only be done once the user clears all the fines incurred.

**********Users**********

1. Users can view available book details under different categories along with the quantities of books remaining.
2. Users can edit their profile 
3. Certain books should be made available for admins only (the concept should be extended to facilitate premium users later on). 
4. Users can view the books they have taken and the books they have reuqested.

**********Admin/Superadmin/Librarian**********

1. Admin can create another admin.
2. Admins should have /admin endpoint to CRUD books and update their profile info.
3. Admins can view the books taken in the ascending/descending order by date.
4. Admins can view books taken by a particular user i.e., his/her history.
5. Admins can view fines of different users and clear them upon receipt of fines.