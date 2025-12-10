# Guide Utilisateur - Système de Recrutement PHRM

## 👨‍💼 Pour le Super Admin

### 📌 Accès au Tableau de Bord
1. Aller à `/super-admin`
2. Accéder à la section **"Offres à valider"** et **"Candidatures Reçues"**

---

## 🎯 Tâche 1 : Créer une Offre d'Emploi

### Étapes :
1. **Ouvrir le formulaire**
   - Cliquer sur le bouton bleu **"+ Nouvelle Offre"**
   - Le formulaire s'affiche

2. **Remplir les informations obligatoires**
   - **Titre** : Ex. "Développeur React Senior"
   - **Description** : Ex. "Nous cherchons un développeur React expérimenté..."

3. **Remplir les informations optionnelles**
   - **Localisation** : Ex. "Yaoundé, Cameroun"
   - **Type de contrat** : Sélectionner CDI/CDD/Stage/Freelance
   - **Salaire** : Ex. "500 000 - 800 000 FCFA"
   - **Compétences** : Ex. "React, Node.js, Firebase, Tailwind CSS" (séparées par virgule)
   - **Expérience minimale** : Ex. "3" ans
   - **Workflow** : Sélectionner "Recrutement Partiel" ou "Recrutement Complet"
   - **Entreprise** : Sélectionner une entreprise (optionnel)

4. **Créer l'offre**
   - Cliquer sur **"Créer l'Offre"**
   - ✅ Offre créée et publiée immédiatement
   - 📧 Email envoyé à l'entreprise si sélectionnée

### Résultat :
- Offre visible sur `/offres` pour les candidats
- Statut : `'published'`
- Source : `'superadmin'`

---

## ✅ Tâche 2 : Valider une Offre d'Entreprise

### Étapes :
1. **Consulter les offres en attente**
   - Section **"Offres à valider"**
   - Voir la liste des offres avec statut `'submitted'`

2. **Examiner l'offre**
   - Cliquer sur **"Voir"** pour ouvrir l'offre en détail
   - Vérifier le titre, description, compétences requises, etc.

3. **Décider**
   - **Publier** ✅ : Cliquer le bouton vert **"Publier"**
     - Statut change à `'published'`
     - Email de confirmation envoyé à l'entreprise
     - Offre visible aux candidats
   
   - **Refuser** ❌ : Cliquer le bouton rouge **"Refuser"**
     - Popup demande le motif du refus
     - Entrer le motif (ex. "Informations incomplètes")
     - Statut change à `'rejected'`
     - Email avec motif envoyé à l'entreprise

### Résultat :
- Offre publiée ou rejetée
- Entreprise notifiée par email

---

## 📋 Tâche 3 : Gérer les Candidatures

### Étapes :

#### 3.1 - Consulter les Candidatures
1. **Aller à "Candidatures Reçues"**
   - Voir la liste de TOUTES les candidatures reçues

2. **Filtrer (optionnel)**
   - **Par offre** : Sélectionner une offre spécifique
   - **Par statut** : Sélectionner un statut (Candidature reçue, En sélection, Entretien, Offre, Embauché, Rejeté)
   - Combinaison possible : Offre + Statut

3. **Rafraîchir**
   - Cliquer **"Rafraîchir"** pour charger les dernières candidatures

#### 3.2 - Voir les Détails d'une Candidature
1. **Cliquer sur une candidature**
   - La ligne s'agrandit pour afficher les détails
   - Voir :
     - **Informations du candidat** : Nom, Email, Téléphone, Localisation
     - **Salaire attendu** et **Disponibilité** (si fournis)
     - **Lettre de motivation** (si fournie)

2. **Cliquer à nouveau pour fermer**
   - La candidature se referme

#### 3.3 - Télécharger le CV
1. **Cliquer sur "Télécharger CV"**
   - Accès direct au fichier PDF/DOC du candidat
   - Ouverture dans un nouvel onglet

#### 3.4 - Répondre au Candidat
1. **Cliquer sur "Répondre"**
   - Zone de réponse s'affiche en haut
   - Affiche : "Répondre à [Nom du candidat]"

2. **Rédiger le message**
   - Écrire votre réponse dans la textarea
   - Ex. : "Merci pour votre candidature. Nous aimerions vous rencontrer pour un entretien..."

3. **Envoyer**
   - Cliquer **"Envoyer"**
   - ✅ Email envoyé au candidat
   - Sujet : `"Réponse à votre candidature - [Titre de l'offre]"`

4. **Annuler**
   - Cliquer **"Annuler"** pour fermer la zone de réponse

#### 3.5 - Changer le Statut
1. **Ouvrir la candidature** (cliquer dessus)

2. **Voir le dropdown de statut**
   - En bas à droite des détails
   - Statut actuel sélectionné

3. **Sélectionner un nouveau statut**
   - **Candidature reçue** : Première réception
   - **En sélection** : Candidat sélectionné pour la suite
   - **Entretien** : Entretien programmé/en cours
   - **Offre** : Offre d'emploi envoyée
   - **Embauché** : Candidat accepté et embauché
   - **Rejeté** : Candidat rejeté

4. **Changement automatique**
   - Statut mis à jour immédiatement
   - Timestamp `updatedAt` enregistré

### Exemple de Workflow Complet :
```
Candidat postule
    ↓
Statut : "Candidature reçue" (applied)
    ↓
Super admin examine CV
    ↓
Super admin change statut → "En sélection" (screening)
    ↓
Super admin envoie email : "Merci, nous examinons votre profil"
    ↓
Super admin change statut → "Entretien" (interview)
    ↓
Super admin envoie email : "Entretien programmé le 15/12 à 10h"
    ↓
Super admin change statut → "Offre" (offer)
    ↓
Super admin envoie email : "Nous sommes heureux de vous proposer..."
    ↓
Super admin change statut → "Embauché" (hired)
    ↓
Candidat reçoit email de confirmation
```

---

## 👤 Pour le Candidat

### 📌 Accès au Portail
1. Aller à `/offres`
2. Voir toutes les offres publiées

---

## 🔍 Tâche 1 : Rechercher une Offre

### Étapes :
1. **Voir les offres disponibles**
   - Affichage en grille de cartes
   - Chaque carte montre : Titre, Entreprise, Localisation, Type de contrat, Compétences

2. **Filtrer les offres**
   - **Recherche par titre/compétences** : Entrer dans le champ de recherche
   - **Localisation** : Entrer la ville/région
   - **Type de contrat** : Sélectionner CDI/CDD/Stage/Freelance
   - Cliquer **"Rechercher"** pour appliquer les filtres

3. **Voir plus de détails**
   - Cliquer sur une offre
   - Voir la description complète, compétences requises, salaire, expérience minimale

---

## 📝 Tâche 2 : Postuler à une Offre

### Étapes :
1. **Cliquer sur "Postuler maintenant"**
   - Sur la page de détail de l'offre
   - Redirection vers `/postuler/{jobId}`

2. **Authentification**
   - Si pas connecté : Cliquer **"Continuer avec Google"**
   - Créer un compte ou se connecter
   - Profil candidat créé automatiquement

3. **Remplir le formulaire**
   - **Informations obligatoires** :
     - Nom complet
     - Email
     - CV (upload PDF/DOC)
   
   - **Informations optionnelles** (cliquer "Informations complémentaires") :
     - Téléphone
     - Localisation
     - Lettre de motivation
     - Salaire attendu
     - Disponibilité
     - LinkedIn
     - Portfolio

4. **Envoyer la candidature**
   - Cliquer **"Envoyer ma candidature"**
   - ✅ Message de succès
   - Redirection vers la page de l'offre après 4 secondes

### Résultat :
- Candidature créée avec statut `'applied'`
- Super admin reçoit la candidature
- Candidat peut voir sa candidature dans "Mes candidatures"

---

## 📊 Tâche 3 : Suivre ses Candidatures

### Étapes :
1. **Aller à `/candidat/mes-candidatures`**
   - Voir toutes les candidatures envoyées

2. **Voir les détails**
   - Titre de l'offre
   - Localisation
   - Date de candidature
   - Statut actuel

3. **Cliquer sur une candidature**
   - Voir les détails de l'offre
   - Vérifier si des réponses du super admin

---

## 👤 Tâche 4 : Gérer son Profil

### Étapes :
1. **Aller à `/candidat/profil`**
   - Voir et modifier les informations personnelles

2. **Éditer les informations**
   - Nom, Email, Téléphone, Localisation
   - Cliquer **"Sauvegarder"**

3. **Gérer les CV**
   - **Ajouter un CV** : Cliquer sur la zone d'upload
   - **Téléverser** : Cliquer le bouton bleu
   - **Supprimer un CV** : Cliquer l'icône poubelle
   - Max 10 CV stockés

---

## 📧 Communication par Email

### Emails Reçus par le Candidat :

1. **Confirmation de candidature**
   - Après soumission du formulaire
   - Sujet : "Candidature reçue"

2. **Réponse du super admin**
   - Quand super admin clique "Répondre"
   - Sujet : "Réponse à votre candidature - [Titre de l'offre]"
   - Contenu : Message personnalisé du super admin

### Emails Reçus par l'Entreprise :

1. **Offre publiée**
   - Quand super admin publie une offre créée par l'entreprise
   - Sujet : "Offre publiée - [Titre]"
   - Contient le lien public

2. **Offre refusée**
   - Quand super admin refuse une offre
   - Sujet : "Offre refusée - [Titre]"
   - Contient le motif du refus

3. **Nouvelle offre créée** (si créée par super admin)
   - Quand super admin crée une offre pour l'entreprise
   - Sujet : "Nouvelle offre créée - [Titre]"
   - Contient le lien public

---

## 🎨 Interface Visuelle

### Super Admin - Offres à Valider
```
┌─────────────────────────────────────────────────────────┐
│ Créer une Offre                    [+ Nouvelle Offre]   │
├─────────────────────────────────────────────────────────┤
│ [Formulaire de création]                                │
│ Titre: [________________]  Entreprise: [Sélectionner]   │
│ Description: [_____________________]                    │
│ Localisation: [_______] Contrat: [CDI▼]                │
│ Salaire: [_______] Compétences: [_______]              │
│ Expérience: [__] Workflow: [Partiel▼]                  │
│                              [Annuler] [Créer l'Offre]  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Offres à valider                   [Rafraîchir]         │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Développeur React Senior                            │ │
│ │ Yaoundé • CDI • Workflow: partial                   │ │
│ │                    [Voir] [✓ Publier] [✗ Refuser]  │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Infirmier(ère) Polyvalent(e)                        │ │
│ │ Douala • CDD • Workflow: full                       │ │
│ │                    [Voir] [✓ Publier] [✗ Refuser]  │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Super Admin - Candidatures Reçues
```
┌─────────────────────────────────────────────────────────┐
│ Candidatures Reçues                [Rafraîchir]         │
├─────────────────────────────────────────────────────────┤
│ Filtres: [Toutes les offres▼] [Tous les statuts▼]      │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Développeur React Senior                            │ │
│ │ Jean Dupont                      [applied] 15/12/24 │ │
│ └─────────────────────────────────────────────────────┘ │
│   ↓ (Cliquer pour voir les détails)
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Informations du candidat                            │ │
│ │ Nom: Jean Dupont                                    │ │
│ │ Email: jean@example.com                             │ │
│ │ Téléphone: +237 6 XX XX XX XX                       │ │
│ │ Localisation: Yaoundé                               │ │
│ │ Salaire attendu: 600 000 FCFA                       │ │
│ │ Disponibilité: Immédiate                            │ │
│ │                                                      │ │
│ │ Lettre de motivation                                │ │
│ │ "Bonjour, je suis intéressé par ce poste..."        │ │
│ │                                                      │ │
│ │ [Télécharger CV] [Répondre] [Statut: applied▼]     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## ⚠️ Points Importants

1. **Toutes les offres doivent être publiées** avant que les candidats puissent postuler
2. **Toutes les candidatures** sont reçues par le super admin
3. **Le super admin contrôle le workflow** complet de recrutement
4. **Les emails** sont envoyés automatiquement via Firebase Mail
5. **Les statuts** peuvent être changés à tout moment
6. **Les candidats** peuvent voir leur statut dans "Mes candidatures"

---

## 🆘 Dépannage

### Problème : Offre ne s'affiche pas
- Vérifier que le statut est `'published'`
- Vérifier que la date de publication est passée

### Problème : Candidature ne s'affiche pas
- Vérifier que le candidat est connecté
- Vérifier que l'offre est publiée
- Rafraîchir la page

### Problème : Email non reçu
- Vérifier l'adresse email du destinataire
- Vérifier les spams
- Vérifier que Firebase Mail est configuré

---

## 📞 Support

Pour toute question, consultez :
- `RECRUITMENT_PROCESS_ANALYSIS.md` : Analyse technique
- `RECRUITMENT_WORKFLOW_UPDATE.md` : Détails des changements
