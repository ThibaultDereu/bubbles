# bubbles

pour voir le résultat :

https://thibaultdereu.github.io/bubbles/

*n'oubliez pas de vider le cache de votre navigateur pour voir la dernière version !


TODO : 
 - créer un itérateur de boules. Sinon en itérant sur l'array grille.boules on tombera sur des éléments null.
 - supprimer les boules voisines si groupe d'au moins 3 boules de même couleur. 
   (recherche en profondeur ou largeur). 
 - après suppression des groupes de plus de 2, rechercher les groupes de boules non reliées au plafond et les faire disparaître.
 - ajouter des contrôles (nb boules par rang, niveau de difficulté)
 - game over si la dernière ligne insérée dépasse la limite.
 - une classe Partie qui est instanciée lorsque le joueur a saisi
 ses paramètres (difficulté etc.) et lance une partie.
 - trouver un moyen pour que les boules soient moins "collantes".
