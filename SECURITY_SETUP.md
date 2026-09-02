# Authentication setup

The website uses Firebase Authentication and a Firestore `users` document to assign each account either `viewer` or `admin` access.

1. In Firebase Console, open project `medical-cases-c4809`.
2. In **Authentication > Sign-in method**, enable **Email/Password**.
3. In **Authentication > Settings > Authorized domains**, add `onehealthgpuc.github.io` if it is not already listed. Set an appropriate password policy while in Authentication settings.
4. In **Authentication > Users**, create each person's account. Do not add public self-registration.
5. Copy the generated UID for each user.
6. For the first administrator, create a `users` collection in Firestore. Create a document whose ID is exactly the user's UID, with one string field: `role` = `admin`.
7. In **Firestore Database > Rules**, publish the contents of `firestore.rules`.

Create and test the first admin before publishing the restrictive rules. Password accounts are created in Firebase Authentication; authenticated administrators can assign website roles from the site's **Users** page.

After the first administrator is working, use the website's **Users** page to invite additional people. The site creates their Authentication account with a random temporary password, assigns the selected role, and emails a secure Firebase password-reset link so they choose their own password. Users can request another link from **Forgot password** at any time.

## Important file-upload limitation

Case attachments currently use unsigned Cloudinary upload presets. Firebase rules protect the Firestore case records, but Cloudinary URLs may remain accessible to anyone who knows a URL, and an unsigned preset can potentially be used outside this site. For sensitive or identifiable health information, migrate attachments to Firebase Storage with authenticated Storage rules or a server-side signed upload endpoint before relying on this site for confidential records.
