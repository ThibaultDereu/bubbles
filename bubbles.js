/*
TODO : 
 - important : créer un itérateur de boules. Sinon en itérant sur l'array grille.boules on tombera sur des éléments null.
 - ajouter des contrôles (nb boules par rang, niveau de difficulté)
 - game over si la dernière ligne insérée dépasse la limite.
 - une classe Partie qui est instanciée lorsque le joueur a saisi
 ses paramètres (difficulté etc.) et lance une partie.
 */


const NB_BOULES_PAR_RANG = 12;
var canvas = document.getElementById('game_canvas');
const RAYON_BOULES = canvas.width / (NB_BOULES_PAR_RANG + 0.5) / 2;
var ctx = canvas.getContext('2d');
var couleurs = ['rgb(255, 27, 27)', 'rgb(86, 190, 255)', 'rgb(76, 255, 23)', 'rgb(255, 237, 16)', 'rgb(255, 86, 210)'];
var canvas_buffer = document.createElement('canvas');
canvas_buffer.width = canvas.width + RAYON_BOULES;
canvas_buffer.height = canvas.height + RAYON_BOULES;
var ctx_buffer = canvas_buffer.getContext('2d');

function calcul_distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}



class Boule {
    constructor(context) {
        this.context = context;
        this.couleur = couleurs[Math.floor(Math.random() * couleurs.length)];
        this.x = 0;
        this.y = 0;
    }

    
    toString() {
        return `boule (${this.couleur}, ${this.x}, ${this.y})`
    }

    
    draw() {
        this.context.globalCompositeOperation = 'source-over';
        this.context.beginPath();
        this.context.arc(this.x, this.y, RAYON_BOULES * 0.9, 0, Math.PI * 2, true);
        this.context.lineWidth = RAYON_BOULES * 0.1;
        this.context.strokeStyle = 'black';
        this.context.stroke();
        var grad = this.context.createRadialGradient(this.x - RAYON_BOULES * 0.3, this.y - RAYON_BOULES * 0.3, RAYON_BOULES / 10, this.x, this.y, RAYON_BOULES)
        
        grad.addColorStop(0, "white");
        grad.addColorStop(1, this.couleur);
        this.context.fillStyle = grad;
        this.context.fill();
    }
    
    
    effacer() {
        // redessiner la boule à sa position actuelle en mode gomme.
        this.context.globalCompositeOperation = 'destination-out';
        this.context.beginPath();
        this.context.arc(this.x, this.y, RAYON_BOULES, 0, Math.PI*2, true);
        this.context.fill();
        return;
    }
}


class Grille {
    constructor(context) {
        this.context = context;
        this.boules = [];
        this.nb_lignes_generees = 0;
    }
    
    
    draw() {
        this.context.clearRect(0, 0, canvas.width, canvas.height);
        this.context.globalCompositeOperation = 'source-over';
        
        //dessiner toutes les boules une par une.
        for (let li of this.boules) {
            for (let bo of li) {
                bo.draw();
            }
        }
    }
    
    
    inserer_lignes(nb_lignes) {
        /* 
           ancienne méthode : redessiner chaque boule une par une à chaque frame.
           => pas fluide du tout si nombre de boules élevées.
           nouvelle méthode : stocker l'ensemble du canvas dans canvas buffer,
           et récupérer l'image à chaque frame.
           https://stackoverflow.com/questions/3952856/why-is-putimagedata-so-slow
        */
        if (nb_lignes <= 0) {
            //on n'arme le canon que quand toutes les lignes sont à leur place.
            canon.armer();
            return;
        }
        
        var ligne = [];
                
        var callback_descendre_grille = (function() {
            //inserer une ligne de boules 
            for (let i = 0; i < NB_BOULES_PAR_RANG; i++) {
                let boule = new Boule(ctx);
                let decalage_droite = RAYON_BOULES * (this.nb_lignes_generees % 2);
                boule.x = RAYON_BOULES * 2 * i + RAYON_BOULES + decalage_droite;
                boule.y = RAYON_BOULES;
                boule.draw();
                ligne.push(boule);
            }
            this.boules.unshift(ligne);
            this.nb_lignes_generees++;
            // inserer les lignes restantes
            this.inserer_lignes(nb_lignes - 1);
        }.bind(this));
        
        /* NB: arrondissement du nombre de pixels à descendre : 
        si celui-ci n'est pas entier, il y aura décalage entre la position 
        réelle des boules et leur  position visible à l'écran. 
        Vraisemblablement parce que le 3e argument de drawImage() est 
        automatiquement arrondi au pixel le plus proche.
        */
        this.descendre_grille(Math.round(RAYON_BOULES * Math.sqrt(3)), Math.round(RAYON_BOULES / 3), callback_descendre_grille)
    }
  
        
    descendre_grille(restant, step, callback_fin) {
        
        if (restant > 0) {
                      
            step = Math.min(restant, step);
            
            for (let li of this.boules) {
                for (let bo of li) {            
                    bo.y += step;
                }
            }
            
            // sauvegarder image sur un canvas invisible
            ctx_buffer.clearRect(0, 0, canvas_buffer.width, canvas_buffer.height);
            ctx_buffer.drawImage(canvas, 0, 0);
            
            //coller sur le canvas visible
            this.context.clearRect(0, 0, canvas.width, canvas.height);
            this.context.drawImage(canvas_buffer, 0, step);
            
            let next_descendre_grille = function() {
                this.descendre_grille(restant - step, step, callback_fin);
            }.bind(this);
                        
            let raf = window.requestAnimationFrame(next_descendre_grille);
        }
        else {
            callback_fin();
        }

    }
    
    
    integrer_boule(boule) {
        /* 
          ajuster la position d'une boule par rapport à la grille, 
          et ajouter cette boule dans la grille.
        */
                
        let hauteur_interligne = Math.round(RAYON_BOULES * Math.sqrt(3));
        let ligne = Math.round((boule.y - RAYON_BOULES) / hauteur_interligne);
        let decalage_droite = ligne % 2;
        let rang = Math.round((boule.x - RAYON_BOULES - RAYON_BOULES * decalage_droite) / (2 * RAYON_BOULES));
        
        // pas terrible, mais avec un array, pas le choix...
        if (this.boules.length == ligne) {
            this.boules.push([]) 
            for (let i = 0; i < this.boules[ligne - 1].length; i++) {
                this.boules[ligne].push([]);
            }
        }
        
        boule.effacer();
        
        this.boules[ligne][rang] = boule;

        boule.x = RAYON_BOULES * (1 + decalage_droite + 2 * rang);
        boule.y = RAYON_BOULES + ligne * Math.round(RAYON_BOULES * Math.sqrt(3));

        boule.draw();

        return;
    }
    
}



class Canon {
    constructor(context) {
        this.context = context;
        this.angle = null;
        this.boule = null;
        this.canon_arme = false;
        this.trajectoire = null;
        this.context.canvas.addEventListener('mousemove', this.diriger.bind(this));
        this.context.canvas.addEventListener('click', this.feu.bind(this));
    }
    
    
    armer() {
        this.boule = new Boule(this.context);
        this.boule.x = this.context.canvas.width / 2;
        this.boule.y = this.context.canvas.height - RAYON_BOULES*2;
        this.canon_arme = true;
        this.boule.draw(); 
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
        let rect = this.context.canvas.getBoundingClientRect();
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
               Autrement dit, calcul de la prochaine fois que le centre de la boule en mouvement sera à distance rayon_collision (2*RAYON_BOULES) du centre d'un cercle de la grille.
               Ensuite, retenir la collision la plus proche.
            */
            let rayon_collision = RAYON_BOULES * 1.95;  
            let point_candidat = null;
            let point_collision = null;
            
            for (let li of grille.boules) {
                for (let bo of li) {
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
            }
            
            /*
              Rechercher une intersection avec une paroi verticale. 
            */
            let point_rebond = null;
            
            if (Math.cos(angle) > 0) {
                point_rebond = {
                    x : this.context.canvas.width - RAYON_BOULES,
                    y : y_init + Math.sin(angle) * (this.context.canvas.width - RAYON_BOULES - x_init) / Math.cos(angle)
                };
            }
            else if (Math.cos(angle) < 0) {
                point_rebond = {
                    x : RAYON_BOULES,
                    y : y_init + Math.sin(angle) * (RAYON_BOULES - x_init) / Math.cos(angle)
                };
            }

            /*
              Rechercher une intersection avec le plafond
            */
            let point_plafond = {
                x : x_init + Math.cos(angle) * (RAYON_BOULES - y_init) / Math.sin(angle),
                y : RAYON_BOULES
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

    
    feu() {
        
        if (!this.canon_arme || this.angle == null) {
            return;
        }

        this.canon_arme = false;
        this.calculer_trajectoire();
        this.animer_boule(this.angle);
        
    }
    
    
    animer_boule(angle) {
        
        let step = canvas.height / 60;
        let prochain_contact = this.trajectoire[0];
        
        this.boule.effacer();
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
                
        this.boule.draw();
        
        if (this.trajectoire.length == 0) {
            grille.integrer_boule(this.boule);
            this.boule = null;
            this.trajectoire = null;
            this.armer();
        }
        else {
            let prochain_step = function() {
                this.animer_boule(angle);
            }.bind(this);

            let raf = window.requestAnimationFrame(prochain_step);
        }
    }
}



var grille = new Grille(ctx);
var canon = new Canon(ctx);
grille.inserer_lignes(11);

