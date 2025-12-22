import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db, storage, auth } from "../firebase";

import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs
} from "firebase/firestore";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

import {
  Building2,
  ArrowLeft,
  Upload,
  FileText,
  Mail,
  Phone,
  User,
  Loader2,
  CheckCircle2,
  Chrome,
  X,
  ChevronDown
} from "lucide-react";

/* ===========================
   Helpers
=========================== */
const safe = (v) => (typeof v === "string" ? v : "");

/* ===========================
   Component
=========================== */
const PublicApply = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  /* Form */
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [errors, setErrors] = useState({});

  /* Optional */
  const [showMore, setShowMore] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [availability, setAvailability] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [portfolio, setPortfolio] = useState("");

  /* Auth */
  const [googleLoading, setGoogleLoading] = useState(false);

  /* ===========================
     Load Job
  =========================== */
  useEffect(() => {
    const loadJob = async () => {
      try {
        const snap = await getDoc(doc(db, "jobs", jobId));
        if (!snap.exists()) return navigate("/offres");

        const jobData = { id: snap.id, ...snap.data() };
        setJob(jobData);

        if (jobData.companyId) {
          const cSnap = await getDoc(doc(db, "companies", jobData.companyId));
          if (cSnap.exists()) setCompany({ id: cSnap.id, ...cSnap.data() });
        }
      } catch (e) {
        console.error(e);
        navigate("/offres");
      } finally {
        setLoading(false);
      }
    };
    loadJob();
  }, [jobId, navigate]);

  /* ===========================
     Load Candidate Profile
  =========================== */
  useEffect(() => {
    if (!auth.currentUser) return;

    const loadProfile = async () => {
      const snap = await getDoc(doc(db, "candidates", auth.currentUser.uid));
      if (!snap.exists()) return;

      const d = snap.data();
      setFullname(safe(d.name || auth.currentUser.displayName));
      setEmail(safe(d.email || auth.currentUser.email));
      setPhone(safe(d.phone));
      setLocation(safe(d.location));
      setCoverLetter(safe(d.coverLetter));
      setExpectedSalary(safe(d.expectedSalary));
      setAvailability(safe(d.availability));
      setLinkedIn(safe(d.linkedIn));
      setPortfolio(safe(d.portfolio));
    };

    loadProfile();
  }, [auth.currentUser]);

  /* ===========================
     Google Sign In
  =========================== */
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);

      const refDoc = doc(db, "candidates", user.uid);
      const snap = await getDoc(refDoc);

      if (!snap.exists()) {
        await setDoc(refDoc, {
          userId: user.uid,
          name: user.displayName || "",
          email: user.email || "",
          createdAt: serverTimestamp()
        });
      }
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user") {
        alert("Connexion échouée");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  /* ===========================
     Validation
  =========================== */
  const validate = () => {
    const e = {};
    if (!fullname.trim()) e.fullname = "Nom requis";
    if (!email.trim()) e.email = "Email requis";
    if (!resumeFile) e.resume = "CV obligatoire";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ===========================
     Utils
  =========================== */
  const hasAlreadyApplied = async (uid) => {
    const q = query(
      collection(db, "applications"),
      where("candidateId", "==", uid),
      where("jobId", "==", jobId)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  };

  const uploadResume = async (uid, file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    const fileRef = ref(
      storage,
      `candidates/${uid}/resumes/${Date.now()}.${ext}`
    );
    const snap = await uploadBytes(fileRef, file);
    return {
      url: await getDownloadURL(snap.ref),
      filename: file.name
    };
  };

  /* ===========================
     Submit
  =========================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!auth.currentUser) return alert("Connexion requise");

    setSubmitting(true);
    try {
      const uid = auth.currentUser.uid;

      if (await hasAlreadyApplied(uid)) {
        alert("Vous avez déjà postulé à cette offre");
        return;
      }

      const resume = await uploadResume(uid, resumeFile);

      await addDoc(collection(db, "applications"), {
        jobId,
        companyId: job.companyId || null,
        candidateId: uid,
        status: "applied",
        source: "public",
        resume,
        candidateSnapshot: {
          fullname: safe(fullname),
          email: safe(email),
          phone: safe(phone),
          location: safe(location)
        },
        meta: {
          coverLetter: safe(coverLetter),
          expectedSalary: safe(expectedSalary),
          availability: safe(availability),
          linkedIn: safe(linkedIn),
          portfolio: safe(portfolio)
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await setDoc(
        doc(db, "candidates", uid),
        {
          name: safe(fullname),
          email: safe(email),
          phone: safe(phone),
          location: safe(location),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      setDone(true);
      setTimeout(() => navigate(`/offres/${jobId}`), 4000);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  /* ===========================
     Render
  =========================== */
  if (loading) return <LoadingScreen />;
  if (!job) return null;

  return (
    <>
      <Header job={job} company={company} />

      <div className="max-w-4xl mx-auto px-4 py-8 -mt-6">
        {done && <SuccessMessage />}

        {!auth.currentUser && !done && (
          <AuthGate loading={googleLoading} onLogin={handleGoogleSignIn} />
        )}

        {auth.currentUser && !done && (
          <ApplicationForm
            {...{
              fullname,
              email,
              phone,
              location,
              resumeFile,
              errors,
              submitting,
              showMore,
              coverLetter,
              expectedSalary,
              availability,
              linkedIn,
              portfolio,
              setFullname,
              setEmail,
              setPhone,
              setLocation,
              setResumeFile,
              setShowMore,
              setCoverLetter,
              setExpectedSalary,
              setAvailability,
              setLinkedIn,
              setPortfolio,
              handleSubmit
            }}
          />
        )}
      </div>
    </>
  );
};

/* ===========================
   UI COMPONENTS
=========================== */

const Header = ({ job, company }) => (
  <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to={`/offres/${job.id}`} className="inline-flex items-center text-white/80 mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" /> Retour
      </Link>
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt={company.name} />
          ) : (
            <Building2 />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">Postuler chez {company?.name}</h1>
          <p className="text-lg">{job.title}</p>
        </div>
      </div>
    </div>
  </div>
);

const AuthGate = ({ loading, onLogin }) => (
  <div className="bg-white p-8 rounded-2xl text-center shadow">
    <h2 className="text-xl font-bold mb-4">Connexion requise</h2>
    <button
      onClick={onLogin}
      disabled={loading}
      className="flex items-center justify-center gap-3 w-full border py-3 rounded-xl"
    >
      <Chrome />
      {loading ? "Connexion..." : "Continuer avec Google"}
    </button>
  </div>
);

const ApplicationForm = ({
  fullname, email, phone, location, resumeFile, errors, submitting,
  showMore, coverLetter, expectedSalary, availability, linkedIn, portfolio,
  setFullname, setEmail, setPhone, setLocation, setResumeFile,
  setShowMore, setCoverLetter, setExpectedSalary,
  setAvailability, setLinkedIn, setPortfolio,
  handleSubmit
}) => (
  <form onSubmit={handleSubmit} className="space-y-8">
    {/* infos principales */}
    <div className="bg-white p-6 rounded-2xl shadow">
      <div className="grid sm:grid-cols-2 gap-6">
        <Input label="Nom complet *" icon={<User />} value={fullname} onChange={setFullname} error={errors.fullname} />
        <Input label="Email *" icon={<Mail />} value={email} onChange={setEmail} error={errors.email} />
        <Input label="Téléphone" icon={<Phone />} value={phone} onChange={setPhone} />
        <Input label="Localisation" value={location} onChange={setLocation} />
      </div>

      <div className="mt-6">
        <label className="block mb-2 font-semibold">CV *</label>
        <label className="border-dashed border-2 p-6 rounded-xl block text-center cursor-pointer">
          {resumeFile ? resumeFile.name : "Cliquez pour uploader"}
          <input type="file" hidden accept=".pdf,.doc,.docx"
            onChange={(e) => setResumeFile(e.target.files[0])} />
        </label>
        {errors.resume && <p className="text-red-600">{errors.resume}</p>}
      </div>
    </div>

    {/* options */}
    <div className="bg-gray-50 rounded-2xl border">
      <button type="button" onClick={() => setShowMore(!showMore)}
        className="w-full p-4 flex justify-between">
        Infos complémentaires
        <ChevronDown className={showMore ? "rotate-180" : ""} />
      </button>

      {showMore && (
        <div className="p-6 space-y-4">
          <Textarea label="Lettre de motivation" value={coverLetter} onChange={setCoverLetter} />
          <Input label="Salaire attendu" value={expectedSalary} onChange={setExpectedSalary} />
          <Input label="Disponibilité" value={availability} onChange={setAvailability} />
          <Input label="LinkedIn" value={linkedIn} onChange={setLinkedIn} />
          <Input label="Portfolio" value={portfolio} onChange={setPortfolio} />
        </div>
      )}
    </div>

    <button disabled={submitting}
      className="bg-indigo-600 text-white px-8 py-4 rounded-xl w-full font-bold">
      {submitting ? "Envoi..." : "Envoyer ma candidature"}
    </button>
  </form>
);

const Input = ({ label, icon, error, value, onChange }) => (
  <div>
    <label className="block mb-1 font-semibold">{label}</label>
    <div className="flex gap-2 border px-3 py-2 rounded-xl">
      {icon}
      <input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 outline-none" />
    </div>
    {error && <p className="text-red-600 text-sm">{error}</p>}
  </div>
);

const Textarea = ({ label, value, onChange }) => (
  <div>
    <label className="block mb-1 font-semibold">{label}</label>
    <textarea value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded-xl p-3" />
  </div>
);

const LoadingScreen = () => (
  <div className="h-screen flex items-center justify-center">
    <Loader2 className="animate-spin w-10 h-10" />
  </div>
);

const SuccessMessage = () => (
  <div className="bg-green-600 text-white p-10 rounded-2xl text-center">
    <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
    <h2 className="text-2xl font-bold">Candidature envoyée</h2>
    <p>Vous recevrez une confirmation par email.</p>
  </div>
);

export default PublicApply;
