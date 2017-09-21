# bubbles

pour voir le résultat :

https://thibaultdereu.github.io/bubbles/

*n'oubliez pas de vider le cache de votre navigateur pour voir la dernière version !*


##TODO : 
 - ajouter des contrôles (nb boules par rang, niveau de difficulté)
 - game over si la dernière ligne insérée dépasse la limite.
 - une classe Partie qui est instanciée lorsque le joueur a saisi
 ses paramètres (difficulté etc.) et lance une partie.
 
 - idée : trouver un moyen pour que les boules soient moins "collantes".
   => solution possible : avoir une surface de collision plus faible. 
   problème de cette solution : les boules s'effacent au cours de leur trajectoire; si une boule passe trop près d'une autre boule, elle gommera une partie de celle-ci.
   => solution possible : travailler avec 2 canvas visibles : un canvas pour les objets qui ne se déplacent pas, et un autre pour les objets qui se déplacent. Quand un objet se déplace, il passe dans le canvas des objets mouvants, et revient dans le canvas des objets immobiles lorsque son mouvement est terminé. à tester.
 - idée : faire apparaître la trajectoire entière à mesure que la souris se déplace. Ou bien ne le faire que pendant que la souris est appuyée.