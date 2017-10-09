
var canvas = document.getElementById('canvas_game');
var ctx = canvas.getContext('2d');

/*
dimensions du canvas.
NB: cela affectera la résolution et la largeur du canvas, mais pas sa hauteur.
Cette dernière est variable et plafonnée à 100% de l'écran par la feuille de style.
*/
canvas.height = 800;
canvas.width = 600;

var couleurs = [];
var type_boule = {
    COULEUR: 1,
    NOIRE: 2,
    BOMBE: 3,
    PINCEAU: 4
}
var gestionnaire_frames; 
var gestionnaire_sons;
var rayon_boules;
var modele_boules;
var nb_boules_par_rang;
var grille;
var canon;
var partie;


function init() {
    partie = new Partie();
}



class Partie {
    constructor() {
        nb_boules_par_rang = 12 ;
        this.nb_couleurs = 5;
        this.nb_boules_detruites = 0;
        this.initialiser();
        
    }
    
    initialiser() {
        let form_debut = document.getElementById('form_debut');
        
        // input nb boules par rangée
        let range_nb_boules = document.getElementById('range_nb_boules');
        range_nb_boules.value = nb_boules_par_rang;
        let value_nb_boules = document.getElementById('value_nb_boules');
        value_nb_boules.textContent = range_nb_boules.value;
        range_nb_boules.addEventListener('input', function() {
            nb_boules_par_rang = Number(range_nb_boules.value);
            value_nb_boules.textContent = range_nb_boules.value;
        }.bind(this));
        
        // input nb couleurs
        let range_nb_couleurs = document.getElementById('range_nb_couleurs');
        range_nb_couleurs.value = this.nb_couleurs;
        let value_nb_couleurs = document.getElementById('value_nb_couleurs');
        value_nb_couleurs.textContent = range_nb_couleurs.value,
        range_nb_couleurs.addEventListener('input', function() {
            this.nb_couleurs = Number(range_nb_couleurs.value);
            value_nb_couleurs.textContent = Number(range_nb_couleurs.value);
        }.bind(this));
                
        // bouton démarrer
        document.getElementById('bouton_demarrer').addEventListener('mouseup', this.demarrer.bind(this));
        form_debut.style.display = 'block';
    }
    
    demarrer() {
        form_debut.style.display = 'none';
        
        couleurs = [
            {r: 255, g: 0, b: 0},
            {r:86, g:190, b:255},
            {r:76, g:255, b:23}, 
            {r:255, g:237, b:16}, 
            {r:255, g:86, b:210},
            {r:255, g:255, b:255},
            {r:150, g:48, b:255},
            {r:255, g:173, b:42}
        ].slice(0, this.nb_couleurs);
        this.frequence_lignes = Math.ceil(nb_boules_par_rang / 3) + this.nb_couleurs;
        
        gestionnaire_frames = new Gestionnaire_frames();
        gestionnaire_sons = new Gestionnaire_sons();
        rayon_boules = canvas.width / (nb_boules_par_rang + 0.5) / 2;
        modele_boules = new Modele_boules();
        grille = new Grille();
        canon = new Canon();
        grille.inserer_lignes(2);
        this.nb_boules_detruites = 0;
        this.afficher_points();
    }
    
    terminer() {
        document.getElementById('form_debut').style.display = 'block';
    }
    
        
    afficher_points() {
        ctx.font = "40px Calibri,Geneva,Arial";
        ctx.strokeStyle = "rgb(0,0,0)";
        ctx.fillStyle = "rgb(100, 136, 255)";
        ctx.fillText(String(this.nb_boules_detruites), 450, 770);
        gestionnaire_frames.fonctions_apres.push(this.afficher_points.bind(this));
    }
}


class Modele_boules {
    /*
    Cette classe permet de gérer toutes les images de boules.
    */
    constructor() {
        this.images_couleurs = new Map();
        
        // générer les images des boules colorées et les stocker
        for (let co of couleurs) {
            this.images_couleurs.set(co, this.generer_image(co));
        }
        
        // générer l'image de la boule noire
        this.image_boule_noire = this.generer_image({
            r: 120,
            g: 120,
            b: 120
        });
        
        this.image_boule_bombe = new Image();
        this.image_boule_bombe.src = 'images/image_bombe.png';
        this.image_boule_pinceau = new Image();
        this.image_boule_pinceau.src = 'images/ball_rainbow.png';
        
        // générer les images d'explosion
        this.images_explosion = [];
        for (let i = 0; i < 58; i++) {
            
            let img = new Image();
            let src = 'images/images_explosion/explosion' + ('0000' + String(i)).slice(-4) + '.png';
            // utilisation fonction setTimeout pour charger les images en asynchrone.
            window.setTimeout(function() {
                img.src = src;
                this.images_explosion.push(img);
            }.bind(this), 0);
        }
    }
    
    generer_image(couleur) {
        // générer les boules sur un canvas invisible
        // et les retourner sous forme de dataURL
        let canvas_boules = document.createElement('canvas');
        canvas_boules.width = rayon_boules * 2;
        canvas_boules.height = rayon_boules * 2;
        let ctx_boules = canvas_boules.getContext('2d');

        for (let i = 0; i < couleurs.length ; i++) {
            ctx_boules.clearRect(0, 0, canvas_boules.width, canvas_boules.height);
            ctx_boules.globalCompositeOperation = 'source-over';
            ctx_boules.beginPath();
            let x = rayon_boules;
            let y = rayon_boules;
            ctx_boules.arc(x, y, rayon_boules * 0.9, 0, Math.PI * 2, true);
            let grad = ctx.createRadialGradient(
                x - rayon_boules * 0.3, 
                y - rayon_boules * 0.3, 
                rayon_boules / 10, 
                x, 
                y, 
                rayon_boules);
            grad.addColorStop(0, `rgb(${couleur.r}, ${couleur.g}, ${couleur.b}`);
            grad.addColorStop(1, `rgb(${Math.round(couleur.r*0.7)}, ${Math.round(couleur.g*0.7)}, ${Math.round(couleur.b*0.7)}`);
            ctx_boules.fillStyle = grad;
            ctx_boules.fill();  

            let img = new Image();
            img.src = canvas_boules.toDataURL();
            return img;
        }
    }
    
    get_image(type, couleur) {
        if (type == type_boule.COULEUR) {
            return this.images_couleurs.get(couleur);
        }
        else if (type == type_boule.NOIRE) {
            return this.image_boule_noire;
        }
        else if (type == type_boule.BOMBE) {
            return this.image_boule_bombe;
        }
        else if (type == type_boule.PINCEAU) {
            return this.image_boule_pinceau;
        }
    }    
}


class Gestionnaire_sons {
    constructor() {
        this.sons = new Map();
        
        let son_laser = new Audio('sons/Laser-SoundBible.com-602495617.mp3');
        // obliger le navigateur à charger le son. (pour chrome android)
        son_laser.load();
        this.sons.set('laser', son_laser);
        // Laser Sound | Recorded by Mike Koenig | http://soundbible.com | License: Attribution 3.0
    
        let son_explosion = new Audio('sons/Mortar Round-SoundBible.com-1560834884.mp3');
        son_explosion.load();
        this.sons.set('explosion', son_explosion);
        // Mortar Round Sound | Recorded by snottyboy | http://soundbible.com | License: Attribution 3.0
        
        let son_grille = new Audio('sons/Mario_Jumping-Mike_Koenig-989896458.mp3');
        son_grille.load();
        this.sons.set('grille', son_grille);
        // Mario Jumping Sound | Recorded by Mike Koenig | http://soundbible.com | License: Attribution 3.0
        
        let son_rebond = new Audio('sons/Bounce-SoundBible.com-12678623.mp3');
        son_rebond.load();
        this.sons.set('rebond', son_rebond);
        // Bounce Sound | Recorded by Mike Koenig | http://soundbible.com | License: Attribution 3.0
    }
    
    play(nom_son) {
        let son = this.sons.get(nom_son);
        // la méthode play ne fait rien si le son est déjà en cours, donc il faut remettre à 0 le son.
        if (son.currentTime != 0) {
            son.currentTime = 0;
        }
        this.sons.get(nom_son).play();
    }
}


class Gestionnaire_frames {
    /*
    Cette classe sert à gérer toutes les animations.
    Si on souhaite afficher un objet, il faut ajouter sa fonction de rendu dans 
    fonctions_apres ou fonctions_avant.
    Ensuite, activer la méthode trigger() déclenchera un requestAnimationFrame(), 
    qui effacera la totalité du canvas et lancera toutes les fonctions stockées 
    dans le gestionnaire de frames. 
    Pour tout objet affiché à l'écran, c'est sa fonction de rendu qui doit se resoumettre
    récursivement dans le gestionnaire de frames.
    L'appel de la méthode trigger() n'est nécessaire que lorsqu'il y a une animation; 
    un objet statique a juste besoin de resoumettre sa fonction de dessin, sans nécessité
    de déclencher trigger().
    L'array fonctions_avant a surtout vocation à soumettre des fonctions de mise à jour des
    données (position d'une boule par exemple) si besoin, et l'array fonctions_apres à 
    effectuer des rendus. Cela peut être utile lorsque la mise à jour et le rendu sont
    effectués par des fonctions différentes, et qu'on veut s'assurer que la fonction de 
    mise à jour est exécutée avant la fonction de rendu.
    (exemple : mise à jour de la position d'une boule avec la méthode Grille.descendreGrille(),
    et affichage des boules avec la méthode Boule.draw().)
    */
    constructor() {
        this.fonctions_avant = [];
        this.fonctions_apres = [];
        this.triggered = false;
        this.actif = false;
    }

    
    trigger() {
        // On ne fait qu'une frame à la fois.
        // Si une demande est faite pendant que le gestionnaire est déjà actif, on retrigger à la fin de l'activité.
        if (!this.actif) {
            let next_frame = function() {
                this.actif = true;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                let fonctions = this.fonctions_avant.slice();
                this.fonctions_avant = [];

                while (fonctions.length) {
                    let f = fonctions.shift();
                    f();
                }
                
                fonctions = this.fonctions_apres.slice();
                this.fonctions_apres = [];
                
                while (fonctions.length) {
                    let f = fonctions.shift();
                    f();
                }
                
                this.actif = false;
                
                if (this.triggered) {
                    this.triggered = false;
                    this.trigger();
                }
            }.bind(this);
            window.requestAnimationFrame(next_frame);
        }
        else {
            this.triggered = true;
        }
    }
}



class Boule {
    constructor(proba_couleur = 1, proba_noir = 0, proba_bombe = 0, proba_pinceau = 0) {
        this.x = 0;
        this.y = 0;
        this.couleur = null;
        
        // sélectionne au hasard le type en fonction des probabilités
        let somme_proba = proba_couleur + proba_noir + proba_bombe + proba_pinceau;
        let array_proba = Array(proba_couleur).fill(type_boule.COULEUR);
        array_proba = array_proba.concat(Array(proba_noir).fill(type_boule.NOIRE));
        array_proba = array_proba.concat(Array(proba_bombe).fill(type_boule.BOMBE));
        array_proba = array_proba.concat(Array(proba_pinceau).fill(type_boule.PINCEAU));
        let idx = Math.floor(Math.random() * somme_proba);
        this.type = array_proba[idx];
        
        // sélection au hasard de la couleur
        if (this.type == 1) {
            this.couleur = couleurs[Math.floor(Math.random() * couleurs.length)];
        }
        else {
            this.couleur = 'black';
        }
        
        this.visible = true;
        gestionnaire_frames.fonctions_apres.push(this.draw.bind(this));
    }
    
    
    draw() {
        if (this.visible) {
            let image = modele_boules.get_image(this.type, this.couleur);
            ctx.drawImage(image, this.x - rayon_boules, this.y - rayon_boules, rayon_boules * 2, rayon_boules * 2);
            gestionnaire_frames.fonctions_apres.push(this.draw.bind(this));
        }
    }
    
    
    fade_away(ratio = 0.7) {
        this.visible = false;
        
        if (ratio > 0.05) {    
            let image = modele_boules.get_image(this.type, this.couleur);
            let rayon = rayon_boules * ratio;
            ctx.drawImage(image, this.x - rayon, this.y - rayon, rayon*2, rayon*2);
               
            
            let next_frame = function() {
                this.fade_away(ratio - 0.1);
            }.bind(this);
            
            gestionnaire_frames.fonctions_apres.push(next_frame);
        }  
        
        gestionnaire_frames.trigger();
    }
    
    
    tomber(chute = rayon_boules * 10) {
        if (chute > 0) {
            let step = rayon_boules / 2;            
            this.y += step;
            
            let next_frame = function() {
                this.tomber(chute - step);
            }.bind(this);
            
            gestionnaire_frames.fonctions_avant.push(next_frame);
        }
        else {
            this.visible = false;
        }
        
        gestionnaire_frames.trigger();
    }
    
    
    exploser(numero_image = 0) {
        this.visible = false;
        if (numero_image < modele_boules.images_explosion.length) {
            let img = modele_boules.images_explosion[numero_image];
            let rayon = rayon_boules * 4;
            ctx.drawImage(img, this.x - rayon, this.y - rayon, rayon*2, rayon*2);
            let next_frame = function() {
                this.exploser(numero_image + 1);
            }.bind(this);
            gestionnaire_frames.fonctions_apres.push(next_frame);
        }
        gestionnaire_frames.trigger();
    }
}



class Grille {
    constructor() {
        this.lignes = [];
        this.nb_lignes_generees = 0;
        this.hauteur_interligne = rayon_boules * Math.sqrt(3);
    }
    
    
    get_boules() {
        let boules = new Set();
        for (let li of this.lignes) {
            for(let bo of li) {
                if (bo != null) {
                    boules.add(bo);
                }
            }
        }
        return boules;
    }
    
    
    inserer_lignes(nb_lignes) {
        
        for (let i = 1; i <= nb_lignes; i++) {
            let ligne = [];
            for (let j = 0; j < nb_boules_par_rang; j++) {
                let boule = new Boule(90, 5, 0, 5);
                
                let decalage_droite = rayon_boules * (this.nb_lignes_generees % 2);
                boule.x = rayon_boules + rayon_boules * 2 * j + decalage_droite;
                boule.y = rayon_boules - this.hauteur_interligne * i;
                ligne.push(boule);
            }
            this.lignes.unshift(ligne);
            this.nb_lignes_generees++;
        }
        
        gestionnaire_frames.fonctions_avant.push(function() {
            this.descendre_grille(nb_lignes * this.hauteur_interligne, rayon_boules / 4);
        }.bind(this));
        
        gestionnaire_frames.trigger();
    }
    
    
    descendre_grille (restant, step) {
        if (restant > 0) {
            step = Math.min(restant, step);
            for (let bo of this.get_boules()) {
                bo.y += step;
            }
            
            gestionnaire_frames.fonctions_avant.push(function() {
                this.descendre_grille(restant - step, step);
            }.bind(this));
            
        }
        else {
            this.check_depassement();
        }
        gestionnaire_frames.trigger();
    }
          

    integrer_boule(boule) {
        /* 
          ajuster la position d'une boule par rapport à la grille, 
          et ajouter cette boule dans la grille.
        */
        
        let position = this.calculer_rang(boule);
        let ligne = position.ligne;
        let decalage_droite = (this.nb_lignes_generees + 1 + ligne) % 2;
        let rang = position.rang;
        
        // si besoin, création d'une ligne vide dans la grille pour accueillir la boule
        if (this.lignes.length == ligne) {
            this.lignes.push([]) 
            for (let i = 0; i < this.nb_boules_par_rang; i++) {
                this.lignes[ligne].push(null);
            }
        }
        
        this.lignes[ligne][rang] = boule;

        boule.x = rayon_boules * (1 + decalage_droite + 2 * rang);
        boule.y = rayon_boules + ligne * this.hauteur_interligne;
        
        gestionnaire_frames.trigger();
        
        // regroupement des boules de même couleur et disparition
        if (boule.type == type_boule.COULEUR) {
            this.regrouper_boule(boule);
            // vérifier si boule peinture touchée et si oui peindre les voisines.
            this.peindre_boules(boule);
        }
        // explosion de la bombe et de ses voisines
        else if (boule.type == type_boule.BOMBE) {
            this.declencher_bombe(boule);
        }
        
        // détachement des boules flottantes
        this.detacher_boules_flottantes();  
        
        // suivant le nb de balles tirées, ajouter une ligne
        if (canon.nb_boules_tirees % partie.frequence_lignes == 0) {
            this.inserer_lignes(1);
            gestionnaire_sons.play('grille');
        }
        else {
            this.check_depassement();
        }
        
        // augmenter le niveau de difficulté
        if (canon.nb_boules_tirees % 20 == 0 && partie.frequence_lignes > 3) {
            partie.frequence_lignes--;
        }
    }
    
    
    calculer_rang(boule) {
        let ligne = Math.round((boule.y - rayon_boules) / this.hauteur_interligne);
        let rang = Math.round((boule.x - rayon_boules - rayon_boules * ((this.nb_lignes_generees + 1 + ligne) % 2)) / (2 * rayon_boules));
        return {
            ligne : ligne,
            rang : rang
        }
    }
    
        
    get_voisins(boule) {
        let voisins = [];
        let ligne = this.calculer_rang(boule).ligne;
        let rang = this.calculer_rang(boule).rang;
        let decalage_droite = (this.nb_lignes_generees + 1 + ligne) % 2
        let coord_voisins = [
            {
                li : ligne - 1,
                ra : rang - 1 + decalage_droite
            },
            {
                li : ligne - 1,
                ra : rang + decalage_droite
            },
            {
                li : ligne,
                ra : rang - 1
            },
            {
                li : ligne,
                ra : rang + 1
            },
            {
                li : ligne + 1,
                ra : rang - 1 + decalage_droite
            },
            {
                li : ligne + 1,
                ra : rang + decalage_droite
            }
        ];
        
        for (let cv of coord_voisins) {
            if (this.lignes[cv.li] !== undefined && 
                this.lignes[cv.li][cv.ra] !== undefined &&
                this.lignes[cv.li][cv.ra] != null) {
                voisins.push(this.lignes[cv.li][cv.ra])
            }
        }
        
        return voisins;
    }
    
    
    regrouper_boule(boule) {  
        let couleur = boule.couleur;
        let groupe_boules = [];
        let queue_boules = [boule];
        let boules_traitees = [];
                
        while (queue_boules.length > 0) {
            boule = queue_boules.shift();
            boules_traitees.push(boule);
            
            if (boule.type == type_boule.COULEUR && boule.couleur == couleur) {
                groupe_boules.push(boule);
                for (let v of this.get_voisins(boule)) {
                    if (!boules_traitees.includes(v) && !queue_boules.includes(v)) {
                        queue_boules.push(v);
                    }
                }
            }
        }
        
        // faire disparaître les boules si un groupe assez grand est trouvé
        if (groupe_boules.length >= 3) {
            for (let bo of groupe_boules) {
                gestionnaire_frames.fonctions_avant.push(bo.fade_away.bind(bo));
                let pos = this.calculer_rang(bo);
                this.lignes[pos.ligne][pos.rang] = null;
                partie.nb_boules_detruites++;
            }
            gestionnaire_sons.play('laser');
        }
    }
    
    
    peindre_boules(boule) {
        let couleur = boule.couleur;
        
        // rechercher une boule pinceau parmi les boules touchées
        for (let bo of this.get_voisins(boule)) {
            if (bo.type == type_boule.PINCEAU) {
                // peindre la boule pinceau
                bo.type = type_boule.COULEUR;
                bo.couleur = couleur;
                
                // peindre les voisins de la boule pinceau
                for (let bo2 of this.get_voisins(bo)) {
                    if (bo2.type != type_boule.PINCEAU) {
                        bo2.type = type_boule.COULEUR;
                        bo2.couleur = couleur;
                    }
                }
                
                // rechercher une boule pinceau récursivement parmi les boules voisines de la boule pinceau
                this.peindre_boules(bo);
            }
        }
        
        gestionnaire_frames.trigger();
        
    }
    
    
    declencher_bombe(boule) {
        for (let bo of this.get_voisins(boule)) {
            gestionnaire_frames.fonctions_avant.push(bo.exploser.bind(bo));
            let pos = this.calculer_rang(bo);
            this.lignes[pos.ligne][pos.rang] = null;
            partie.nb_boules_detruites++;
        }
        
        gestionnaire_sons.play('explosion');
        gestionnaire_frames.fonctions_avant.push(boule.exploser.bind(boule));
        let pos_bombe = this.calculer_rang(boule);
        this.lignes[pos_bombe.ligne][pos_bombe.rang] = null;
        partie.nb_boules_detruites++;
    }
    
    
    detacher_boules_flottantes() {
        let boules_fixees = [];
        let queue_boules = [];
        
        // initialiser les boules_fixees avec toutes les boules collées au plafond.
        for (let bo of grille.lignes[0]) {
            if (bo != null) {
                queue_boules.push(bo);
            }
        }
        
        // rechercher tous les boules fixées
        while (queue_boules.length > 0) {
            let boule = queue_boules.shift();
            boules_fixees.push(boule);
            
            for (let v of this.get_voisins(boule)) {
                if (!boules_fixees.includes(v) && !queue_boules.includes(v)) {
                    queue_boules.push(v);
                }
            }
        }
        
        // toutes les boules de la grille non présentes dans boules_fixees doivent tomber.
        for (let bo of this.get_boules()) {
            if (!boules_fixees.includes(bo)) {
                bo.tomber();
                let pos = this.calculer_rang(bo);
                this.lignes[pos.ligne][pos.rang] = null;
                partie.nb_boules_detruites++;
            }
        }
    }
    
    
    check_depassement() {
        for (let bo of this.get_boules()) {
            if (bo.y > canvas.height - rayon_boules * 3) {
                partie.terminer();
                return;
            }
        }
        canon.armer();
    }
}



function calcul_distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}



class Canon {
    constructor() {
        // état du canon
        this.canon_arme = false;
        this.mouse_down = false;
        this.mouse_in = true;
        
        // attributs du canon
        this.trajectoire = null;
        this.angle = null;
        this.boule = null;
        this.nb_boules_tirees = 0;
        
        // actions souris
        canvas.addEventListener('mouseover', function() {
            this.mouse_in = true;
            gestionnaire_frames.fonctions_apres.push(this.draw_trajectoire.bind(this));
        }.bind(this));
        canvas.addEventListener('mousemove', function(evt) {
            if (this.canon_arme) {
                this.diriger(evt);
            }
        }.bind(this));
        window.addEventListener('mouseup', function() {
            this.mouse_down = false;
            if (this.mouse_in && this.canon_arme && this.angle) {
                this.feu();
            }
        }.bind(this));
        window.addEventListener('mousedown', function(evt) {
            this.mouse_down = true;
            if (this.canon_arme) {
                this.diriger(evt);
                gestionnaire_frames.fonctions_apres.push(this.draw_trajectoire.bind(this));
            }
        }.bind(this));
        canvas.addEventListener('mouseout', function(evt) {
            this.mouse_in = false;
            gestionnaire_frames.trigger()
        }.bind(this));
        
        
        // actions tactiles
        canvas.addEventListener('touchstart', function(touch_event) {
            touch_event.preventDefault();
            this.mouse_down = true;
            if (this.canon_arme) {
                this.diriger(touch_event.touches[0]);
                gestionnaire_frames.fonctions_apres.push(this.draw_trajectoire.bind(this));
            }
            
        }.bind(this));
        canvas.addEventListener('touchmove', function(evt) {
            evt.preventDefault();
            if (this.canon_arme) {
                this.diriger(evt.touches[0]);
            }
        }.bind(this));
        canvas.addEventListener('touchend', function(evt) {
            evt.preventDefault();
            this.mouse_down = false;
            if (this.mouse_in && this.canon_arme && this.angle) {
                this.feu();
            }
        }.bind(this));
    }
    
    
    armer() {
        if (this.canon_arme) {
            return;
        }
        this.boule = new Boule(10, 0, 1, 0);
        this.boule.x = canvas.width / 2;
        this.boule.y = canvas.height - rayon_boules;
        this.canon_arme = true;
        gestionnaire_frames.trigger();
    }
        
    
    diriger(evt) {
        /*
          calculer l'angle de tir en radian.
          comme y est croissant vers le bas, un angle de cosinus positif va vers la gauche,
          et un angle de cosinus négatif vers la droite.
        */
        
        let rect = canvas.getBoundingClientRect();
        // la dimension de l'élément html canvas est différente de la dimension du bitmap, donc conversion.
        let x_souris = (evt.clientX - rect.left) * (canvas.width / rect.width);
        let y_souris = (evt.clientY - rect.top) * (canvas.height / rect.height);
        
        let cos_x = (x_souris - this.boule.x) / Math.sqrt(Math.pow(x_souris - this.boule.x, 2) + Math.pow(this.boule.y - y_souris, 2));
        if (y_souris > this.boule.y - rayon_boules/10) {
            //si on essaie de tirer trop bas, la boule ne doit pas partir
            this.angle = null;
        } 
        else {
            this.angle = - Math.acos(cos_x);
        }    
        // trigger le gestionnaire de frames pour actualiser la trajectoire.
        gestionnaire_frames.trigger()
    }
    
    
    calculer_trajectoire() {
        /*
          calcul de la trajectoire de la boule.
         La trajectoire est un un array dont le dernier élément est le point d'arrêt de la boule, 
         et tous les éléments précédents les points de rebond. 
        */
        
        this.trajectoire = [];
        let trajectoire_terminee = false;      
        let angle = this.angle;
        let x_init = this.boule.x;
        let y_init = this.boule.y;
        
        while (!trajectoire_terminee) {
            /* Rechercher la prochaine boule en collision.
               Autrement dit, calcul de la prochaine fois que le centre de la boule en
               mouvement sera à distance rayon_collision (théoriquement, 2*rayon_boules)
               du centre d'un cercle de la grille.
               Ensuite, retenir la collision la plus proche.
            */
            let rayon_collision = rayon_boules * 1.5;  
            let point_candidat = null;
            let point_collision = null;
            
            for (let bo of grille.get_boules()) {
                /* résolution du polynôme du 2nd degré résultant de l'équation  d'intersection de la trajectoire de la boule 
                  (équation paramétrique de paramètre k) avec le cercle de rayon rayon_collision et de centre (bo.x, bo.y).*/
                let A = Math.pow(Math.cos(angle), 2) + Math.pow(Math.sin(angle), 2);
                let B = 2 * Math.cos(angle) * (x_init - bo.x) + 2 * Math.sin(angle) * (y_init - bo.y);
                let C = Math.pow(x_init - bo.x, 2) + Math.pow(y_init - bo.y, 2) - Math.pow(rayon_collision, 2);
                let delta = Math.pow(B, 2) - 4 * A * C;

                if (delta > 0) {
                    let k1 = (-B - Math.sqrt(delta)) / 2 * A;
                    let k2 = (-B + Math.sqrt(delta)) / 2 * A;
                    let distance1 = calcul_distance(x_init, y_init, x_init + k1 * Math.cos(angle), y_init + k1 * Math.sin(angle))
                    let distance2 = calcul_distance(x_init, y_init, x_init + k2 * Math.cos(angle), y_init + k2 * Math.sin(angle))

                    if (distance1 < distance2) {
                        point_candidat = {
                            x : x_init + k1 * Math.cos(angle),
                            y : y_init + k1 * Math.sin(angle)
                        };
                    }
                    else {
                        point_candidat = {
                            x : x_init + k2 * Math.cos(angle),
                            y : y_init + k2 * Math.sin(angle)
                        };
                    }

                }
                else if (delta == 0) {
                    let k = - B / (2 * A);
                    point_candidat = {
                        x : x_init + k * Math.cos(angle),
                        y : y_init + k * Math.sin(angle)
                    };
                }

                // le point candidat est retenu comme point de prochaine collision si c'est le plus proche de la boule.
                if (!point_collision) {
                    point_collision = point_candidat;
                }
                else if (calcul_distance(x_init, y_init, point_candidat.x, point_candidat.y) < 
                         calcul_distance(x_init, y_init, point_collision.x, point_collision.y)) {
                    point_collision = point_candidat;
                }
            }
            
            /*
              Rechercher une intersection avec une paroi verticale. 
            */
            let point_rebond = null;
            
            if (Math.cos(angle) > 0) {
                point_rebond = {
                    x : canvas.width - rayon_boules,
                    y : y_init + Math.sin(angle) * (canvas.width - rayon_boules - x_init) / Math.cos(angle)
                };
            }
            else if (Math.cos(angle) < 0) {
                point_rebond = {
                    x : rayon_boules,
                    y : y_init + Math.sin(angle) * (rayon_boules - x_init) / Math.cos(angle)
                };
            }

            /*
              Rechercher une intersection avec le plafond
            */
            let point_plafond = {
                x : x_init + Math.cos(angle) * (rayon_boules - y_init) / Math.sin(angle),
                y : rayon_boules
            };
            
            /*
              Choisir le plus proche des points entre point_collision, point_rebond et point_plafond,
              et mettre à jour la trajectoire et l'angle selon ce qui a été choisi.
            */
            let prochain_point = point_plafond;
            
            if (point_collision && calcul_distance(x_init, y_init, point_collision.x, point_collision.y) < calcul_distance(x_init, y_init, prochain_point.x, prochain_point.y)) {
                prochain_point = point_collision;
            }
            if (point_rebond && calcul_distance(x_init, y_init, point_rebond.x, point_rebond.y) < calcul_distance(x_init, y_init, prochain_point.x, prochain_point.y)) {
                prochain_point = point_rebond;
            }
            
            if (prochain_point == point_rebond) {
                trajectoire_terminee = false;
                x_init = prochain_point.x;
                y_init = prochain_point.y;
                angle = Math.PI - angle;
            } else {
                trajectoire_terminee = true;
            }
            
            this.trajectoire.push(prochain_point);
        }
    }
    
    
    draw_trajectoire() {
        if (!this.canon_arme || !this.angle || !this.mouse_down || !this.mouse_in) {
            gestionnaire_frames.trigger();
            return;
        }
        
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (this.boule.type == 1) {
            ctx.strokeStyle = `rgb(${this.boule.couleur.r}, ${this.boule.couleur.g}, ${this.boule.couleur.b})`;
        }
        else {
            ctx.strokeStyle = 'black';
        }
        ctx.beginPath();
        ctx.moveTo(this.boule.x, this.boule.y);
        
        this.calculer_trajectoire();
    
        for (let point of this.trajectoire) {
            ctx.globalAlpha = 0.5;
            ctx.lineTo(point.x, point.y);
        }
        ctx.globalCompositeOperation = 'destination-over';        
        
        ctx.stroke();
        ctx.globalAlpha = 1;
        
        gestionnaire_frames.fonctions_apres.push(this.draw_trajectoire.bind(this));
    }

    
    feu() {
        this.canon_arme = false;
        this.calculer_trajectoire();
        gestionnaire_frames.fonctions_avant.push(function() {
            this.animer_boule(this.angle);
        }.bind(this));
        gestionnaire_frames.trigger();
        this.nb_boules_tirees++;
    }
    
    
    animer_boule(angle) {
        let step = canvas.height / 30;
        let prochain_contact = this.trajectoire[0];

        let next_x = this.boule.x + step * Math.cos(angle);
        let next_y = this.boule.y + step * Math.sin(angle);
        
        if (calcul_distance(this.boule.x, this.boule.y, next_x, next_y) < 
            calcul_distance(this.boule.x, this.boule.y, prochain_contact.x, prochain_contact.y)) {
            this.boule.x = next_x;
            this.boule.y = next_y;
        }
        else {
            this.boule.x = prochain_contact.x;
            this.boule.y = prochain_contact.y;
            this.trajectoire.shift();
            angle = Math.PI - angle;
            // son de rebond si on est sur un point de contact non final.
            if (this.trajectoire.length) {
                gestionnaire_sons.play('rebond');
            }
        }
        
        if (this.trajectoire.length == 0) {
            gestionnaire_frames.trigger();
            grille.integrer_boule(this.boule);
        }
        else {
            let prochain_step = function() {
                this.animer_boule(angle);
            }.bind(this);
            
            gestionnaire_frames.fonctions_apres.push(prochain_step);
            gestionnaire_frames.trigger();
        }
    }
}

    
window.onload = init();
