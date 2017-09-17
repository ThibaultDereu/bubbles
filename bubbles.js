/*
TODO : 
 - ajouter un fichier de configuration. (nb boules par rang? couleurs).
 - ajouter des contrôles (nb boules par rang, niveau de difficulté)
 - game over si la dernière ligne insérée dépasse la limite.
 */


const NB_BOULES_PAR_RANG = 12;
var canvas = document.getElementById('game_canvas');
const RAYON_BOULES = canvas.width / (NB_BOULES_PAR_RANG + 0.5) / 2;
var ctx = canvas.getContext('2d');
var toto = document.getElementById('toto');
var couleurs = ['rgb(255, 27, 27)', 'rgb(42, 173, 255)', 'rgb(76, 255, 23)', 'rgb(255, 237, 16)', 'rgb(255, 86, 210)'];

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
        /* inserer une ligne de nouvelles boules au dessus de la 1ere ligne
           (hors du canvas), et appeler la méthode descendre_grille pour 
           transférer toute la grille vers le bas. 
           
           La technique (brutale) consiste à effacer tout le canvas, 
           à recalculer les coordonnées des boules une par une, et à toutes 
           les re-dessiner une par une à chaque frame.
           
           Pour pouvoir insérer plusieurs lignes, on fait 1 insertion dans
           l'array grille, 1 descendre_grille sur une hauteur de boule, en
           passant à descendre_grille un callback à appeler dès que le 
           transfert est terminé, qui est un nouvel appel à inserer_lignes 
           avec la quantité de lignes restant à insérer.
           
           Résultat : correct, mais plus très fluide si nb de boules élevé.
           Si performances insuffisantes, tester la solution suivante:
           ctx.transfer pour bouger la grille, plutôt que redessiner toutes 
           les boules 1 par 1. => pour éviter de bouger ce qui ne fait pas 
           partie de la grille (le canon, la boule à jeter ou en 
           cours de jet), une solution serait d'utiliser 2 canvas différents.
        */
        if (nb_lignes <= 0) {
            //on n'arme le canon que quand toutes les lignes sont à leur place.
            canon.armer();
            return;
        }
        
        var ligne = [];
                
        //inserer une ligne de boules 
        for (let i = 0; i < NB_BOULES_PAR_RANG; i++) {
            let boule = new Boule(ctx);
            let decalage_droite = RAYON_BOULES * (this.nb_lignes_generees % 2);
            boule.x = RAYON_BOULES * 2 * i + RAYON_BOULES + decalage_droite;
            boule.y = - RAYON_BOULES * (Math.sqrt(3) - 1);
            boule.draw();
            ligne.push(boule);
        }
        
        this.boules.unshift(ligne);
        this.nb_lignes_generees++;
        
        var callback_descendre_grille = (function() {
            this.inserer_lignes(nb_lignes - 1);
        }.bind(this));
        
        window.requestAnimationFrame(this.descendre_grille(RAYON_BOULES * Math.sqrt(3), Math.ceil(RAYON_BOULES / 3), callback_descendre_grille));
        
    }
  
        
    descendre_grille(restant, step, callback_fin) {
            
        return function() {
            if (restant > 0) {
                for (let li of this.boules) {
                    for (let bo of li) {            
                        step = Math.min(restant, step);
                        bo.y += step;
                    }
                }
                this.draw();
                let raf = window.requestAnimationFrame(this.descendre_grille(restant - step, step, callback_fin));
            }
            else {
                callback_fin();
            }
        }.bind(this);
    }
    
    
    caler(boule) {
        // ajuster la position d'une boule par rapport à la grille, 
        // et ajouter cette boule dans la grille.
        return;
    }
}


class Canon {
    constructor(context) {
        this.context = context;
        this.angle = null;
        this.boule = null;
        this.point_arret = null;
        this.context.canvas.addEventListener('mousemove', this.diriger.bind(this));
        let callback_click = function() {
            this.feu(this.angle);
        }.bind(this);
        this.context.canvas.addEventListener('click', callback_click);
    }
    
    
    armer() {
        this.boule = new Boule(this.context);
        this.boule.x = this.context.canvas.width / 2;
        this.boule.y = this.context.canvas.height - RAYON_BOULES*2;     
        this.point_arret = null;
        this.boule.draw(); 
    }
    
    
    diriger(evt) {
        if (this.boule == null) {
            return;
        }
        let rect = this.context.canvas.getBoundingClientRect();
        let x_souris = evt.clientX - rect.left;
        let y_souris = evt.clientY - rect.top;
        let cos_x = (x_souris - this.boule.x) / Math.sqrt(Math.pow(x_souris - this.boule.x, 2) + Math.pow(this.boule.y - y_souris, 2))
        if (y_souris >= this.boule.y) {
            //si on essaie de tirer trop bas, la boule ne doit pas partir
            this.angle = null;
        }
        else {
            this.angle = -Math.acos(cos_x);
        }
        
    }
    
    
    calculer_point_arret(angle) {
        /* calcul de la prochaine boule touchée.
           Autrement dit, calcul de la prochaine fois que le centre de la boule en mouvement sera à distance rayon_collision (environ 2*RAYON_BOULES) du centre d'un cercle de la grille.
           Cela revient à calculer les intersections entre une droite et un cercle. 
           Ensuite, l'intersection qui est au plus près de la position actuelle de la boule permet de connaître la position où la boule s'arrêtera.
        */
        let point_candidat = null;
        let rayon_collision = RAYON_BOULES * 1.9;

        for (let li of grille.boules) {
            for (let bo of li) {
                // résolution du polynôme du 2nd degré résultant de l'équation  d'intersection de la trajectoire de la boule (équation paramétrique de paramètre k) avec le cercle de rayon rayon_collision et de centre (bo.x, bo.y).
                let A = Math.pow(Math.cos(angle), 2) + Math.pow(Math.sin(angle), 2);
                let B = 2 * Math.cos(angle) * (this.boule.x - bo.x) + 2 * Math.sin(angle) * (this.boule.y - bo.y);
                let C = Math.pow(this.boule.x - bo.x, 2) + Math.pow(this.boule.y - bo.y, 2) - Math.pow(rayon_collision, 2);
                let delta = Math.pow(B, 2) - 4 * A * C;

                if (delta > 0) {
                    let k1 = (-B - Math.sqrt(delta)) / 2 * A;
                    let k2 = (-B + Math.sqrt(delta)) / 2 * A;

                    let distance1 = calcul_distance(this.boule.x, this.boule.y, this.boule.x + k1 * Math.cos(angle), this.boule.y + k1 * Math.sin(angle))

                    let distance2 = calcul_distance(this.boule.x, this.boule.y, this.boule.x + k2 * Math.cos(angle), this.boule.y + k2 * Math.sin(angle))

                    if (distance1 < distance2) {
                        point_candidat = {
                            x : this.boule.x + k1 * Math.cos(angle),
                            y : this.boule.y + k1 * Math.sin(angle)
                        };
                    }
                    else {
                        point_candidat = {
                            x : this.boule.x + k2 * Math.cos(angle),
                            y : this.boule.y + k2 * Math.sin(angle)
                        };
                    }

                }
                else if (delta == 0) {
                    let k = - B / (2 * A);
                    point_candidat = {
                        x : this.boule.x + k * Math.cos(angle),
                        y : this.boule.y + k * Math.sin(angle)
                    };
                }
                
                // le point candidat est retenu comme point d'arrêt si c'est le plus proche de la position actuelle de la boule.
                if (!this.point_arret) {
                    this.point_arret = point_candidat;
                }
                else if (calcul_distance(this.boule.x, this.boule.y, point_candidat.x, point_candidat.y) < calcul_distance(this.boule.x, this.boule.y, this.point_arret.x, this.point_arret.y)) {
                    this.point_arret = point_candidat;
                }
            }
        }
    }
    
    feu(angle) {
        /*
        TODO : à l'appel de feu (ou même à l'appel de diriger si on veut), on calcule la trajectoire entière de la boule :
         un array dont le dernier élément est le point d'arrêt de la boule, 
         et tous les éléments précédents les points de rebond. 
         Attention : il faut recalculer l'angle à chaque rebond.
         faut-il mémoriser l'angle dans cet array trajectoire ?
         => tant qu'à faire.
        */
        
        if (this.boule == null || angle == null) {
            return;
        }
        
        let step = RAYON_BOULES * 2 ;
        let feu_termine = false;
            
        // calcul de la prochaine boule touchée.
        if (this.point_arret == null) {
            this.calculer_point_arret(angle);
        }
        
        /*
           Si aucune boule n'est trouvée, on recherche la prochaine paroi verticale rencontrée.
        */
          
        /*
           Si aucune paroi verticale n'est trouvée, on recherche le point d'arrivée au plafond.
        */
        
    
        
        
        //DEBUT OLD
        
        // paroi verticale
        if (this.boule.x + (step + RAYON_BOULES ) * Math.cos(angle) < 0 || this.boule.x + (step + RAYON_BOULES) * Math.cos(angle) > this.context.canvas.width) {
            angle = Math.PI - angle;
        }
        
        this.boule.effacer();

        let next_x = this.boule.x + step * Math.cos(angle);
        let next_y = this.boule.y + step * Math.sin(angle);
        
        if (calcul_distance(this.boule.x, this.boule.y, next_x, next_y) < calcul_distance(this.boule.x, this.boule.y, this.point_arret.x, this.point_arret.y)) {
            this.boule.x = next_x;
            this.boule.y = next_y;
        }
        else {
            this.boule.x = this.point_arret.x;
            this.boule.y = this.point_arret.y;
            feu_termine = true;
        }
        

        this.boule.draw();
        
        if (feu_termine) {
            grille.caler(this.boule);
            //this.boule = null;
            this.armer();
            
        }
        else {
            let prochain_step = function() {
                this.feu(angle);
            }.bind(this);

            let raf = window.requestAnimationFrame(prochain_step);
        }
        
        // FIN OLD
        
        //on rencontre une autre boule ou la paroi du haut
        //this.boule = null;   
    }
}



var grille = new Grille(ctx);
var canon = new Canon(ctx);
grille.inserer_lignes(5);
var fonction = (function() {
    console.log(canon.nbfeux);
})
window.setTimeout(fonction, 5000);


