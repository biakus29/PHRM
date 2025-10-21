import React, { useEffect, useState } from 'react';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { User, Mail, Phone, MapPin, Save, Loader2, Trash2, Upload, FileText } from 'lucide-react';

const CandidateProfile = () => {
  const [candidateId, setCandidateId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [resumes, setResumes] = useState([]);
  const [newResume, setNewResume] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }
    const id = user.uid;
    setCandidateId(id);

    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'candidates', id));
        if (snap.exists()) {
          const data = snap.data();
          setName(data.name || user.displayName || '');
          setEmail(data.email || user.email || '');
          setPhone(data.phone || '');
          setLocation(data.location || '');
          setResumes(Array.isArray(data.resumes) ? data.resumes : []);
        } else {
          setName(user.displayName || '');
          setEmail(user.email || '');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveProfile = async () => {
    if (!candidateId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'candidates', candidateId), {
        userId: candidateId,
        name: name || '',
        email: email || '',
        phone: phone || '',
        location: location || '',
        resumes,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });
    } finally {
      setSaving(false);
    }
  };

  const uploadResume = async () => {
    if (!candidateId || !newResume) return;
    const ext = (newResume.name.split('.').pop() || 'pdf').toLowerCase();
    const fileRef = ref(storage, `candidates/${candidateId}/resumes/${Date.now()}.${ext}`);
    await uploadBytes(fileRef, newResume);
    const url = await getDownloadURL(fileRef);
    const next = [{ name: newResume.name, url, uploadedAt: Date.now() }, ...resumes].slice(0, 10);
    setResumes(next);
    setNewResume(null);
  };

  const deleteResume = async (resume) => {
    try {
      const fileRef = ref(storage, resume.url);
      await deleteObject(fileRef);
    } catch {
      // ignore errors (public URLs may not map back directly)
    }
    setResumes(resumes.filter(r => r.url !== resume.url));
  };

  const themeGradient = 'bg-gradient-to-r from-blue-600 to-indigo-600';

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Chargement…</div>;
  }

  if (!candidateId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
          <p className="text-gray-700">Veuillez vous connecter pour éditer votre profil candidat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${themeGradient} text-white`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Mon profil candidat</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Nom complet</label>
            <div className="flex items-center px-3 py-2 rounded-lg border border-gray-300">
              <User className="w-4 h-4 text-gray-500 mr-2" />
              <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full outline-none" placeholder="Votre nom" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
              <div className="flex items-center px-3 py-2 rounded-lg border border-gray-300">
                <Mail className="w-4 h-4 text-gray-500 mr-2" />
                <input value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full outline-none" placeholder="vous@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Téléphone</label>
              <div className="flex items-center px-3 py-2 rounded-lg border border-gray-300">
                <Phone className="w-4 h-4 text-gray-500 mr-2" />
                <input value={phone} onChange={(e)=>setPhone(e.target.value)} className="w-full outline-none" placeholder="+237 6 XX XX XX XX" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Localisation</label>
            <div className="flex items-center px-3 py-2 rounded-lg border border-gray-300">
              <MapPin className="w-4 h-4 text-gray-500 mr-2" />
              <input value={location} onChange={(e)=>setLocation(e.target.value)} className="w-full outline-none" placeholder="Ville / Pays" />
            </div>
          </div>

          <div className="pt-2">
            <button onClick={saveProfile} disabled={saving} className="inline-flex items-center px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60">
              {saving ? (<><Loader2 className="w-4 h-4 animate-spin mr-2" /> Sauvegarde…</>) : (<><Save className="w-4 h-4 mr-2" /> Sauvegarder</>)}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">Mes CV</h3>
            <label className="flex items-center justify-between px-4 py-3 rounded-xl border-dashed border-2 border-gray-300 bg-gray-50 cursor-pointer">
              <div className="flex items-center gap-3 text-gray-700">
                <Upload className="w-5 h-5" />
                {newResume ? <span className="font-medium">{newResume.name}</span> : <span>Ajouter un CV (PDF/DOC)</span>}
              </div>
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e)=>setNewResume(e.target.files?.[0] || null)} />
              <FileText className="w-5 h-5 text-gray-500" />
            </label>
            <button onClick={uploadResume} disabled={!newResume} className="mt-3 w-full px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-60">Téléverser</button>

            <ul className="mt-4 space-y-2">
              {resumes.length === 0 && <li className="text-sm text-gray-500">Aucun CV enregistré</li>}
              {resumes.map((r, i) => (
                <li key={i} className="flex items-center justify-between text-sm">
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-700">{r.name || `CV ${i+1}`}</a>
                  <button onClick={()=>deleteResume(r)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfile;
