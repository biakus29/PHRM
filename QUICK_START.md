# Quick Start - Système de Recrutement

## ⚡ Démarrage Rapide

### Pour le Super Admin

#### 1️⃣ Créer une Offre en 2 minutes
```
1. Aller à /super-admin
2. Cliquer "Offres à valider" → "+ Nouvelle Offre"
3. Remplir :
   - Titre : "Développeur React"
   - Description : "Nous cherchons..."
   - Localisation : "Yaoundé"
   - Contrat : "CDI"
   - Compétences : "React, Node.js, Firebase"
4. Cliquer "Créer l'Offre"
✅ Offre publiée et visible aux candidats
```

#### 2️⃣ Valider une Offre d'Entreprise en 1 minute
```
1. Aller à "Offres à valider"
2. Voir les offres en attente
3. Cliquer "Publier" ✅ ou "Refuser" ❌
✅ Entreprise notifiée par email
```

#### 3️⃣ Gérer les Candidatures en 3 minutes
```
1. Aller à "Candidatures Reçues"
2. Filtrer par offre/statut (optionnel)
3. Cliquer sur une candidature pour voir les détails
4. Actions :
   - Télécharger CV
   - Répondre par email
   - Changer le statut (dropdown)
✅ Candidat reçoit votre réponse
```

---

### Pour le Candidat

#### 1️⃣ Postuler en 3 minutes
```
1. Aller à /offres
2. Trouver une offre
3. Cliquer "Postuler maintenant"
4. Se connecter avec Google
5. Remplir le formulaire :
   - Nom, Email, CV (obligatoires)
   - Autres infos (optionnelles)
6. Cliquer "Envoyer ma candidature"
✅ Candidature reçue par super admin
```

#### 2️⃣ Suivre ses Candidatures en 1 minute
```
1. Aller à /candidat/mes-candidatures
2. Voir toutes les candidatures
3. Voir le statut de chaque candidature
✅ Reçoit les réponses du super admin par email
```

---

## 🎯 Cas d'Usage Courants

### Cas 1 : Recruter pour une Offre
```
Super Admin :
  1. Crée l'offre
  2. Publie immédiatement
  3. Candidats postulent
  4. Super admin change statut : applied → screening → interview → offer → hired

Candidat :
  1. Voit l'offre
  2. Postule
  3. Reçoit des réponses du super admin
  4. Suit son statut
```

### Cas 2 : Valider une Offre d'Entreprise
```
Entreprise :
  1. Crée une offre
  2. Statut : submitted

Super Admin :
  1. Reçoit la notification
  2. Examine l'offre
  3. Publie ou refuse
  4. Entreprise reçoit email

Candidats :
  1. Voient l'offre (si publiée)
  2. Postulent
```

### Cas 3 : Communiquer avec un Candidat
```
Super Admin :
  1. Ouvre la candidature
  2. Clique "Répondre"
  3. Écrit un message
  4. Clique "Envoyer"
  5. Change le statut

Candidat :
  1. Reçoit email du super admin
  2. Voit son statut mis à jour
  3. Peut répondre par email
```

---

## 📊 Statuts Disponibles

```
applied      → Candidature reçue
screening    → En sélection
interview    → Entretien
offer        → Offre
hired        → Embauché
rejected     → Rejeté
```

---

## 🔗 URLs Importantes

| Page | URL | Qui |
|------|-----|-----|
| Offres | `/offres` | Candidats |
| Détail Offre | `/offres/{jobId}` | Candidats |
| Postuler | `/postuler/{jobId}` | Candidats |
| Profil Candidat | `/candidat/profil` | Candidats |
| Mes Candidatures | `/candidat/mes-candidatures` | Candidats |
| Super Admin | `/super-admin` | Super Admin |

---

## 💾 Données Reçues par Super Admin

### Pour Chaque Candidature :
```
✅ Nom du candidat
✅ Email du candidat
✅ Téléphone du candidat
✅ Localisation du candidat
✅ CV (fichier)
✅ Lettre de motivation
✅ Salaire attendu
✅ Disponibilité
✅ LinkedIn
✅ Portfolio
✅ Titre de l'offre
✅ Date de candidature
✅ Statut
```

---

## 🎨 Interface

### Super Admin - Créer une Offre
```
[+ Nouvelle Offre]
├─ Titre *
├─ Description *
├─ Localisation
├─ Type de contrat
├─ Salaire
├─ Compétences
├─ Expérience minimale
├─ Workflow
├─ Entreprise
└─ [Créer l'Offre]
```

### Super Admin - Gérer Candidatures
```
Filtres: [Offre▼] [Statut▼]

Candidature 1
├─ Titre de l'offre
├─ Nom du candidat
├─ Statut [badge]
├─ Date
└─ [Cliquer pour détails]
   ├─ Infos candidat
   ├─ Lettre de motivation
   ├─ [Télécharger CV]
   ├─ [Répondre]
   └─ [Statut: applied▼]

Candidature 2
...
```

---

## ⚡ Raccourcis Clavier

| Action | Raccourci |
|--------|-----------|
| Créer offre | `Ctrl+N` (à implémenter) |
| Répondre | `Ctrl+R` (à implémenter) |
| Changer statut | `Ctrl+S` (à implémenter) |

---

## 🆘 Problèmes Courants

### Problème : Offre ne s'affiche pas
**Solution** : Vérifier que le statut est `published`

### Problème : Candidature ne s'affiche pas
**Solution** : 
- Vérifier que le candidat est connecté
- Vérifier que l'offre est publiée
- Rafraîchir la page

### Problème : Email non reçu
**Solution** :
- Vérifier l'adresse email
- Vérifier les spams
- Vérifier que Firebase Mail est configuré

### Problème : CV ne se télécharge pas
**Solution** :
- Vérifier que l'URL du CV est valide
- Vérifier les permissions Firebase Storage
- Essayer avec un autre navigateur

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- `RECRUITMENT_USER_GUIDE.md` - Guide complet
- `RECRUITMENT_WORKFLOW_UPDATE.md` - Détails techniques
- `FIRESTORE_SECURITY_RULES.md` - Sécurité
- `IMPLEMENTATION_SUMMARY.md` - Résumé

---

## 🚀 Prochaines Étapes

1. **Implémenter les règles de sécurité Firestore**
   - Voir `FIRESTORE_SECURITY_RULES.md`

2. **Ajouter les notifications automatiques**
   - Email au candidat quand statut change

3. **Créer les templates d'email**
   - Prédéfinis pour chaque statut

4. **Ajouter les analytics**
   - Nombre de candidatures
   - Taux de conversion
   - Temps de traitement

---

## 📞 Support

**Questions ?** Consultez la documentation ou contactez l'équipe.

---

**Bon recrutement ! 🎉**
