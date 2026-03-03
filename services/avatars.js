import * as ImagePicker from "expo-image-picker";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";

import { auth, storage } from "../firebase";
import { updateUserProfile } from "./users";

// uri -> blob
async function uriToBlob(uri) {
  const res = await fetch(uri);
  return await res.blob();
}

export const pickAndUploadAvatar = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not logged in");

  // permission
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error("No permission to access photos");

  // pick image
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaType.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return null;

  const uri = result.assets?.[0]?.uri;
  if (!uri) throw new Error("No image selected");

  // upload
  const blob = await uriToBlob(uri);
  const avatarRef = ref(storage, `users/${user.uid}/avatar.jpg`);

  await uploadBytes(avatarRef, blob, { contentType: "image/jpeg" });
  const url = await getDownloadURL(avatarRef);

  // update auth + firestore
  await updateProfile(user, { photoURL: url });
  await updateUserProfile(user.uid, { photoURL: url });

  return url;
};
