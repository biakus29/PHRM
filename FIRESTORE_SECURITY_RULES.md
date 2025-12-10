# Règles de Sécurité Firestore - Système de Recrutement

## ⚠️ IMPORTANT

Ces règles doivent être implémentées dans la console Firebase pour sécuriser le système de recrutement.

---

## 📋 Règles Recommandées

### Collection `jobs`

```javascript
match /jobs/{jobId} {
  // Lecture : Tous les utilisateurs peuvent voir les offres publiées
  allow read: if resource.data.status == 'published';
  
  // Création : Seules les entreprises et super admin
  allow create: if request.auth != null && 
                (request.auth.token.role == 'company' || 
                 request.auth.token.role == 'superadmin');
  
  // Modification : Seul le super admin peut modifier les offres
  allow update: if request.auth != null && 
                request.auth.token.role == 'superadmin';
  
  // Suppression : Seul le super admin
  allow delete: if request.auth != null && 
                request.auth.token.role == 'superadmin';
}
```

### Collection `applications`

```javascript
match /applications/{appId} {
  // Lecture : Super admin voit tout, candidat voit ses propres candidatures
  allow read: if request.auth != null && 
              (request.auth.token.role == 'superadmin' || 
               resource.data.candidateId == request.auth.uid);
  
  // Création : Seuls les candidats authentifiés
  allow create: if request.auth != null && 
                request.auth.token.role == 'candidate' &&
                request.resource.data.candidateId == request.auth.uid;
  
  // Modification : Seul le super admin
  allow update: if request.auth != null && 
                request.auth.token.role == 'superadmin';
  
  // Suppression : Seul le super admin
  allow delete: if request.auth != null && 
                request.auth.token.role == 'superadmin';
}
```

### Collection `candidates`

```javascript
match /candidates/{candidateId} {
  // Lecture : Candidat voit son profil, super admin voit tout
  allow read: if request.auth != null && 
              (request.auth.uid == candidateId || 
               request.auth.token.role == 'superadmin');
  
  // Création : Candidat crée son propre profil
  allow create: if request.auth != null && 
                request.auth.uid == candidateId;
  
  // Modification : Candidat modifie son profil, super admin peut modifier
  allow update: if request.auth != null && 
                (request.auth.uid == candidateId || 
                 request.auth.token.role == 'superadmin');
  
  // Suppression : Seul le super admin
  allow delete: if request.auth != null && 
                request.auth.token.role == 'superadmin';
}
```

### Collection `companies`

```javascript
match /companies/{companyId} {
  // Lecture : Tous les utilisateurs authentifiés
  allow read: if request.auth != null;
  
  // Création : Seul le super admin
  allow create: if request.auth != null && 
                request.auth.token.role == 'superadmin';
  
  // Modification : Entreprise modifie son profil, super admin peut modifier
  allow update: if request.auth != null && 
                (request.auth.uid == companyId || 
                 request.auth.token.role == 'superadmin');
  
  // Suppression : Seul le super admin
  allow delete: if request.auth != null && 
                request.auth.token.role == 'superadmin';
}
```

### Collection `mail` (Firebase Extension)

```javascript
match /mail/{document=**} {
  // Création : Seul le super admin peut envoyer des emails
  allow create: if request.auth != null && 
                request.auth.token.role == 'superadmin';
  
  // Lecture : Seul le super admin
  allow read: if request.auth != null && 
              request.auth.token.role == 'superadmin';
  
  // Modification/Suppression : Interdites
  allow update, delete: if false;
}
```

---

## 🔐 Implémentation des Rôles

### Dans Firebase Authentication

Vous devez ajouter des **Custom Claims** aux utilisateurs :

```javascript
// Pour un super admin
{
  "role": "superadmin"
}

// Pour une entreprise
{
  "role": "company",
  "companyId": "company_id_here"
}

// Pour un candidat
{
  "role": "candidate"
}
```

### Code pour Ajouter les Rôles (Admin SDK)

```javascript
// Exemple avec Node.js Admin SDK
const admin = require('firebase-admin');

// Super Admin
await admin.auth().setCustomUserClaims(superAdminUid, { role: 'superadmin' });

// Company
await admin.auth().setCustomUserClaims(companyUid, { 
  role: 'company',
  companyId: companyId 
});

// Candidate
await admin.auth().setCustomUserClaims(candidateUid, { role: 'candidate' });
```

---

## 📊 Matrice de Permissions

| Action | Super Admin | Entreprise | Candidat |
|--------|-------------|-----------|----------|
| **Créer offre** | ✅ | ✅ | ❌ |
| **Publier offre** | ✅ | ❌ | ❌ |
| **Refuser offre** | ✅ | ❌ | ❌ |
| **Voir offres publiées** | ✅ | ✅ | ✅ |
| **Voir offres en attente** | ✅ | ❌ | ❌ |
| **Créer candidature** | ❌ | ❌ | ✅ |
| **Voir toutes candidatures** | ✅ | ❌ | ❌ |
| **Voir ses candidatures** | ✅ | ❌ | ✅ |
| **Modifier statut candidature** | ✅ | ❌ | ❌ |
| **Envoyer email** | ✅ | ❌ | ❌ |
| **Voir profil candidat** | ✅ | ❌ | ✅ (son) |
| **Modifier profil candidat** | ✅ | ❌ | ✅ (son) |

---

## 🛡️ Bonnes Pratiques

### 1. Validation des Données
```javascript
// Exemple : Validation lors de la création d'une candidature
match /applications/{appId} {
  allow create: if request.auth != null && 
                request.resource.data.keys().hasAll(['jobId', 'candidateId', 'status']) &&
                request.resource.data.status == 'applied' &&
                request.resource.data.candidateId == request.auth.uid;
}
```

### 2. Limitation des Modifications
```javascript
// Exemple : Seuls certains champs peuvent être modifiés
match /applications/{appId} {
  allow update: if request.auth != null && 
                request.auth.token.role == 'superadmin' &&
                request.resource.data.status in ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
}
```

### 3. Audit Trail
```javascript
// Ajouter un timestamp à chaque modification
match /applications/{appId} {
  allow update: if request.auth != null && 
                request.auth.token.role == 'superadmin' &&
                request.resource.data.updatedAt == request.time;
}
```

---

## 🚨 Sécurité Supplémentaire

### 1. Rate Limiting
Implémenter un rate limiting pour éviter les abus :
- Max 5 candidatures par candidat par jour
- Max 10 emails par super admin par minute

### 2. Validation des URLs
- Vérifier que les URLs de CV sont valides
- Vérifier que les URLs de CV proviennent de Firebase Storage

### 3. Chiffrement des Données Sensibles
- Email du candidat : Chiffrer en base de données
- Téléphone : Chiffrer en base de données
- CV : Stocker en privé dans Firebase Storage

### 4. Audit Logging
- Logger toutes les modifications de statut
- Logger tous les emails envoyés
- Logger toutes les créations/suppressions d'offres

---

## ✅ Checklist de Sécurité

- [ ] Règles Firestore implémentées
- [ ] Custom Claims configurés pour tous les utilisateurs
- [ ] Validation des données côté client
- [ ] Validation des données côté serveur (Firestore Rules)
- [ ] Rate limiting implémenté
- [ ] Audit logging configuré
- [ ] Données sensibles chiffrées
- [ ] Firebase Storage sécurisé (CVs privés)
- [ ] Tests de sécurité effectués
- [ ] Documentation mise à jour

---

## 🧪 Tests de Sécurité

### Test 1 : Candidat ne peut pas voir d'autres candidatures
```javascript
// Devrait échouer
db.collection('applications')
  .where('candidateId', '!=', currentUser.uid)
  .get()
```

### Test 2 : Candidat ne peut pas modifier le statut
```javascript
// Devrait échouer
db.collection('applications').doc(appId).update({
  status: 'hired'
})
```

### Test 3 : Super admin peut voir toutes les candidatures
```javascript
// Devrait réussir
db.collection('applications').get()
```

### Test 4 : Entreprise ne peut pas publier ses propres offres
```javascript
// Devrait échouer
db.collection('jobs').doc(jobId).update({
  status: 'published'
})
```

---

## 📝 Notes Importantes

1. **Custom Claims** : Doivent être configurés via Firebase Admin SDK ou Console
2. **Propagation** : Les Custom Claims peuvent prendre quelques minutes à se propager
3. **Refresh Token** : L'utilisateur doit se reconnecter pour que les nouveaux claims soient appliqués
4. **Firestore Rules** : Testez les règles dans l'émulateur avant de les déployer en production

---

## 🔗 Ressources

- [Firestore Security Rules Documentation](https://firebase.google.com/docs/firestore/security/start)
- [Custom Claims Documentation](https://firebase.google.com/docs/auth/admin-setup)
- [Firestore Rules Playground](https://firebase.google.com/docs/rules/simulator)

---

## 📞 Support

Pour toute question sur la sécurité, consultez la documentation Firebase officielle ou contactez l'équipe de sécurité.
