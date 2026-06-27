import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import {
    collection,
    CollectionReference,
    doc,
    DocumentData,
    getDocs,
    getFirestore,
    query,
    serverTimestamp,
    where,
    writeBatch,
} from 'firebase/firestore';

const env = process.env as Record<string, string | undefined>;
const expoExtra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

const firebaseConfig = {
  apiKey: expoExtra['EXPO_PUBLIC_FIREBASE_API_KEY'] || env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: expoExtra['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'] || env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: expoExtra['EXPO_PUBLIC_FIREBASE_PROJECT_ID'] || env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: expoExtra['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'] || env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: expoExtra['EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'] || env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: expoExtra['EXPO_PUBLIC_FIREBASE_APP_ID'] || env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

console.log('Firebase Config:', { 
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  expoExtra: Object.keys(expoExtra)
});

if (Object.values(firebaseConfig).some((value) => !value)) {
  console.error('Missing Firebase config values:', firebaseConfig);
  throw new Error(
    'Firebase configuration is incomplete. Set EXPO_PUBLIC_FIREBASE_* environment variables in app.json or via your Expo config.'
  );
}

const app = initializeApp(firebaseConfig);
export const firestore = getFirestore(app);

export const menusCollection = collection(firestore, 'menus') as CollectionReference<DocumentData>;
export const menuItemsCollection = collection(firestore, 'menuItems') as CollectionReference<DocumentData>;
export const ratingsCollection = collection(firestore, 'ratings') as CollectionReference<DocumentData>;
export const commentsCollection = collection(firestore, 'comments') as CollectionReference<DocumentData>;
export const submissionsCollection = collection(firestore, 'submissions') as CollectionReference<DocumentData>;

export function menuDoc(menuId: string) {
  return doc(menusCollection, menuId);
}

export function menuItemDoc(menuItemId: string) {
  return doc(menuItemsCollection, menuItemId);
}

export function ratingDoc(ratingId: string) {
  return doc(ratingsCollection, ratingId);
}

export async function createMenuWithItems(
  title: string,
  joinCode: string,
  items: string[],
  viewPassword?: string
) {
  const menuRef = doc(menusCollection);
  const batch = writeBatch(firestore);

  console.log('Creating menu:', { title, joinCode, itemCount: items.length, menuRefId: menuRef.id });

  batch.set(menuRef, {
    title,
    joinCode,
    viewPassword: viewPassword ?? null,
    createdAt: serverTimestamp(),
  });

  items.forEach((item, index) => {
    const itemRef = doc(menuItemsCollection);
    batch.set(itemRef, {
      menuId: menuRef.id,
      name: item,
      order: index + 1,
      createdAt: serverTimestamp(),
    });
  });

  try {
    console.log('Starting Firestore batch commit...');
    const commitPromise = batch.commit();
    const timeoutPromise = new Promise<void>((_, reject) =>
      setTimeout(() => reject(new Error('Firestore commit timed out after 30 seconds.')), 30000)
    );

    await Promise.race([commitPromise, timeoutPromise]);
    console.log('Menu created successfully:', menuRef.id);
    return { menuId: menuRef.id, joinCode };
  } catch (error) {
    console.error('Firestore batch commit error:', error);
    throw error;
  }
}

export async function getMenuByJoinCode(joinCode: string) {
  try {
    const q = query(menusCollection, where('joinCode', '==', joinCode.toUpperCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Menu not found. Check the join code and try again.');
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data() as { title: string; joinCode: string; viewPassword?: string | null };
    return {
      id: doc.id,
      title: data.title,
      joinCode: data.joinCode,
      viewPassword: data.viewPassword ?? null,
    };
  } catch (error) {
    console.error('Error querying menu by join code:', error);
    throw error;
  }
}

export async function getMenuItems(menuId: string) {
  try {
    const q = query(menuItemsCollection, where('menuId', '==', menuId));
    const querySnapshot = await getDocs(q);

    const items = querySnapshot.docs.map((doc) => {
      const data = doc.data() as { name: string; order: number };
      return {
        id: doc.id,
        name: data.name,
        order: data.order,
      };
    });

    // Sort by order field
    items.sort((a, b) => (a.order || 0) - (b.order || 0));

    return items;
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
}

export async function saveRatings(
  menuId: string,
  ratings: { itemId: string; rating: number }[],
  note?: string | null,
  reviewerName?: string,
  comments?: { itemId: string; text: string }[]
) {
  const batch = writeBatch(firestore);

  // create a submission document to group this user's ratings/comments
  const submissionRef = doc(submissionsCollection);
  batch.set(submissionRef, {
    menuId,
    note: note ?? null,
    reviewerName: reviewerName ?? null,
    createdAt: serverTimestamp(),
  });

  ratings.forEach((r) => {
    const ratingRef = doc(ratingsCollection);
    batch.set(ratingRef, {
      menuId,
      itemId: r.itemId,
      rating: r.rating,
      reviewerName: reviewerName ?? null,
      note: note ?? null,
      submissionId: submissionRef.id,
      createdAt: serverTimestamp(),
    });
  });

  // attach any per-item comments to the submission
  (comments ?? []).forEach((c) => {
    const commentRef = doc(commentsCollection);
    batch.set(commentRef, {
      menuId,
      itemId: c.itemId,
      text: c.text,
      submissionId: submissionRef.id,
      createdAt: serverTimestamp(),
    });
  });

  try {
    await batch.commit();
    return { success: true, submissionId: submissionRef.id };
  } catch (error) {
    console.error('Error saving ratings and submission:', error);
    throw error;
  }
}

export async function getRatingsForMenu(menuId: string) {
  try {
    const q = query(ratingsCollection, where('menuId', '==', menuId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data() as { itemId: string; rating: number; note?: string | null; createdAt?: any; submissionId?: string; reviewerName?: string };
      return { itemId: data.itemId, rating: data.rating, note: data.note ?? null, createdAt: data.createdAt ?? null, submissionId: data.submissionId ?? null, reviewerName: data.reviewerName ?? null };
    });
  } catch (error) {
    console.error('Error fetching ratings for menu:', error);
    throw error;
  }
}

export async function saveComment(menuId: string, itemId: string, text: string) {
  try {
    const commentRef = doc(commentsCollection);
    const batch = writeBatch(firestore);
    batch.set(commentRef, {
      menuId,
      itemId,
      text,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error saving comment:', error);
    throw error;
  }
}

export async function getCommentsForMenu(menuId: string) {
  try {
    const q = query(commentsCollection, where('menuId', '==', menuId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data() as { itemId: string; text: string; createdAt?: any; submissionId?: string };
      return { itemId: data.itemId, text: data.text, createdAt: data.createdAt ?? null, submissionId: data.submissionId ?? null };
    });
  } catch (error) {
    console.error('Error fetching comments for menu:', error);
    throw error;
  }
}

export async function getSubmissionsForMenu(menuId: string) {
  try {
    const q = query(submissionsCollection, where('menuId', '==', menuId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => {
      const data = d.data() as { note?: string | null; reviewerName?: string | null; createdAt?: any };
      return { id: d.id, note: data.note ?? null, reviewerName: data.reviewerName ?? null, createdAt: data.createdAt ?? null };
    });
  } catch (error) {
    console.error('Error fetching submissions for menu:', error);
    throw error;
  }
}
