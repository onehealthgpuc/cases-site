# Authentication setup

The website uses Firebase Authentication and a Firestore `users` document to assign each account either `viewer` or `admin` access.

1. In Firebase Console, open project `medical-cases-c4809`.
2. In **Authentication > Sign-in method**, enable **Email/Password**.
3. In **Authentication > Settings > Authorized domains**, add `onehealthgpuc.github.io` if it is not already listed. Set an appropriate password policy while in Authentication settings.
4. In **Authentication > Users**, create each person's account. Do not add public self-registration.
5. Copy the generated UID for each user.
6. In Firestore, create a `users` collection. Create a document whose ID is exactly the user's UID, with one string field: `role` = `viewer` or `admin`.
7. In **Firestore Database > Rules**, publish the contents of `firestore.rules`.

Create and test the first admin before publishing the restrictive rules. Account creation and role changes remain Firebase Console operations, so website users cannot promote themselves.

## Important file-upload limitation

Case attachments currently use unsigned Cloudinary upload presets. Firebase rules protect the Firestore case records, but Cloudinary URLs may remain accessible to anyone who knows a URL, and an unsigned preset can potentially be used outside this site. For sensitive or identifiable health information, migrate attachments to Firebase Storage with authenticated Storage rules or a server-side signed upload endpoint before relying on this site for confidential records.
