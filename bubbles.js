
var canvas = document.getElementById('canvas_game');
var ctx = canvas.getContext('2d');
canvas.height = Math.min(Math.round(window.innerHeight * 0.9), Math.round((window.innerWidth*0.9)/0.8));
canvas.width = Math.round(canvas.height * 0.8);

var gestionnaire_frames; 

var couleurs = [
    {r: 255, g: 0, b: 0},
    {r:86, g:190, b:255},
    {r:76, g:255, b:23}, 
    {r:255, g:237, b:16}, 
    {r:255, g:86, b:210}
];

var rayon_boules;
var modele_boules;
var nb_boules_par_rang;
var grille;
var canon;
var partie;


function init() {
    gestionnaire_frames = new Gestionnaire_frames();

    partie = new Partie();
    partie.demarrer();
    
}



class Partie {
    constructor() {
        // à remplacer par un élément html de saisie du nb de boules en début de partie
        nb_boules_par_rang = 7;
        this.frequence_lignes = Math.ceil(nb_boules_par_rang / 3) + 5;
    }
    
    demarrer() {
        rayon_boules = canvas.width / (nb_boules_par_rang + 0.5) / 2;
        modele_boules = new Modele_boules();
        grille = new Grille();
        canon = new Canon();
        grille.inserer_lignes(Math.floor(nb_boules_par_rang / 2));
    }
    
    terminer() {
         console.log("game over");
    }
    
}


class Modele_boules {
    constructor() {
        this.images = new Map();
        this.generer_images();
    }
    
    generer_images() {
        // générer les boules sur un canvas invisible
        // et les stocker dans des dataURL
        let canvas_boules = document.createElement('canvas');
        canvas_boules.width = rayon_boules * 2;
        canvas_boules.height = rayon_boules * 2;
        let ctx_boules = canvas_boules.getContext('2d');
        
        this.images.clear();

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
            grad.addColorStop(0, `rgb(${couleurs[i].r}, ${couleurs[i].g}, ${couleurs[i].b}`);
            grad.addColorStop(1, `rgb(${Math.round(couleurs[i].r*0.7)}, ${Math.round(couleurs[i].g*0.7)}, ${Math.round(couleurs[i].b*0.7)}`);
            ctx_boules.fillStyle = grad;
            ctx_boules.fill();  

            let img = new Image();
            img.src = canvas_boules.toDataURL();

            this.images.set(couleurs[i], img);
        }
    }    
}


class Gestionnaire_frames {
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

                while (fonctions.length > 0) {
                    let f = fonctions.shift();
                    f();
                }
                
                fonctions = this.fonctions_apres.slice();
                this.fonctions_apres = [];
                
                while (fonctions.length > 0) {
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
    constructor() {
        this.couleur = couleurs[Math.floor(Math.random() * couleurs.length)];
        this.x = 0;
        this.y = 0;
        this.visible = true;
        gestionnaire_frames.fonctions_apres.push(this.draw.bind(this));
    }

    
    toString() {
        return `boule (${this.couleur}, ${this.x}, ${this.y})`
    }
    
    
    draw() {
        if (this.visible) {
            let image = modele_boules.images.get(this.couleur);
            ctx.drawImage(image, this.x - rayon_boules, this.y - rayon_boules);
            gestionnaire_frames.fonctions_apres.push(this.draw.bind(this));
        }
    }
    
    
    fade_away(ratio = 0.7) {
        this.visible = false;
        
        if (ratio > 0.05) {    
            let image = modele_boules.images.get(this.couleur);
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
                let boule = new Boule();
                
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
        
        // se besoin, création d'une ligne vide dans la grille pour accueillir la boule
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

        this.regrouper_boule(boule);
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
            
            if (boule.couleur == couleur) {
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
            }
            this.detacher_boules_flottantes();
        }
        
        // suivant le nb de balles tirées, ajouter une ligne
        if (canon.nb_boules_tirees % partie.frequence_lignes == 0) {
            this.inserer_lignes(1);
        }
        else {
            this.check_depassement();
        }
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
            }
        }
    }
    
    
    check_depassement() {
        for (let bo of this.get_boules()) {
            if (bo.y > canvas.height - rayon_boules*3) {
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
        this.angle = null;
        this.boule = null;
        this.canon_arme = false;
        this.trajectoire = null;
        this.mouse_down = false;
        this.nb_boules_tirees = 0;
        
        // actions souris
        canvas.addEventListener('mousemove', this.diriger.bind(this));
        canvas.addEventListener('mouseup', this.feu.bind(this));
        canvas.addEventListener('mousedown', function(evt) {
            this.mouse_down = true;
            this.diriger(evt);
        }.bind(this));
        canvas.addEventListener('mouseout', function(evt) {
            this.mouse_down = false;
            gestionnaire_frames.trigger();
        }.bind(this));
        
        
        // actions tactiles
        canvas.addEventListener('touchstart', function(touch_event) {
            touch_event.preventDefault();
            this.mouse_down = true;
            this.diriger(touch_event.touches[0]);
        }.bind(this));
        canvas.addEventListener('touchmove', function(evt) {
            evt.preventDefault();
            this.diriger(evt.touches[0]);
        }.bind(this));
        canvas.addEventListener('touchend', function(evt) {
            evt.preventDefault();
            this.feu();
        }.bind(this));
    }
    
    
    armer() {
        this.boule = new Boule();
        this.boule.x = canvas.width / 2;
        this.boule.y = canvas.height - rayon_boules*2;
        this.canon_arme = true;
        gestionnaire_frames.trigger();
    }
    
    
    diriger(evt) {
        /*
          calculer l'angle de tir en radian.
          comme y est croissant vers le bas, un angle de cosinus positif va vers la gauche,
          et un angle de cosinus négatif vers la droite.
        */
        if (!this.canon_arme) {
            return;
        }
        let rect = canvas.getBoundingClientRect();
        let x_souris = evt.clientX - rect.left;
        let y_souris = evt.clientY - rect.top;
        let cos_x = (x_souris - this.boule.x) / Math.sqrt(Math.pow(x_souris - this.boule.x, 2) + Math.pow(this.boule.y - y_souris, 2));
        if (y_souris > this.boule.y) {
            //si on essaie de tirer trop bas, la boule ne doit pas partir
            this.angle = null;
        } 
        else {
            this.angle = - Math.acos(cos_x);
        }

        if (this.mouse_down) {
            gestionnaire_frames.fonctions_apres.push(this.draw_trajectoire.bind(this));
            gestionnaire_frames.trigger();
        }
        
    }
    
    
    calculer_trajectoire() {
        /*
          calcul de la trajectoire de la boule.
         La trajectoire est un un array dont le dernier élément est le point d'arrêt de la boule, 
         et tous les éléments précédents les points de rebond. 
        */
        if (this.boule == null || this.angle == null) {
            return;
        }
        
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
        
        if (this.angle == null || !this.mouse_down) {
            return;
        }
        
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = `rgb(${this.boule.couleur.r}, ${this.boule.couleur.g}, ${this.boule.couleur.b})`;
        ctx.beginPath();
        ctx.moveTo(this.boule.x, this.boule.y);
        
        this.calculer_trajectoire();
    
        for (let point of this.trajectoire) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.globalCompositeOperation = 'source-over';        
        
        ctx.stroke();
        
        gestionnaire_frames.fonctions_apres.push(this.draw_trajectoire.bind(this));
    }

    
    feu() {
        if (!this.canon_arme || this.angle == null || !this.mouse_down) {
            return;
        }
        
        this.mouse_down = false;
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
        }
        
        
        if (this.trajectoire.length == 0) {
            gestionnaire_frames.trigger();
            grille.integrer_boule(this.boule);
            
        }
        else {
            let prochain_step = function() {
                this.animer_boule(angle);
            }.bind(this);
            
            
            gestionnaire_frames.fonctions_avant.push(prochain_step);
            gestionnaire_frames.trigger();
        }
    }
}

    
window.onload = init();