 const POSITION_X_LEFT = -0.5;
 const POSITION_X_CENTER = 0;
 const POSITION_X_RIGHT = 0.5;
 
 /************
  * CONTROLS *
  ************/
 
 // Position is one of 0 (left), 1 (center), or 2 (right)
 var player_position_index = 1;
 
 /**
  * Move player to provided index
  * @param {int} Lane to move player to
  */
 function movePlayerTo(position_index) {
   player_position_index = position_index;
 
   var position = {x: 0, y: 0, z: 0}
   if      (position_index == 0) position.x = POSITION_X_LEFT;
   else if (position_index == 1) position.x = POSITION_X_CENTER;
   else                          position.x = POSITION_X_RIGHT;
   document.getElementById('player').setAttribute('position', position);
 }
 
 /**
  * Determine how `movePlayerTo` will be fired. Use camera's rotation.
  **/
 function setupControls() {
   AFRAME.registerComponent('lane-controls', {
     tick: function (time, timeDelta) {
       var rotation = this.el.object3D.rotation;
 
       if      (rotation.y > 0.1)  movePlayerTo(0);
       else if (rotation.y < -0.1) movePlayerTo(2);
       else                        movePlayerTo(1);
     }
   })
 }
 
 /*********
  * TREES *
  *********/
 
 var templateTreeLeft;
 var templateTreeCenter;
 var templateTreeRight;
 var templates;
 var treeContainer;
 var numberOfTrees = 0;
 var treeTimer;
 
 function setupTrees() {
   templateTreeLeft    = document.getElementById('template-tree-left');
   templateTreeCenter  = document.getElementById('template-tree-center');
   templateTreeRight   = document.getElementById('template-tree-right');
   templates           = [templateTreeLeft, templateTreeCenter, templateTreeRight];
   treeContainer       = document.getElementById('tree-container');
 
   removeTree(templateTreeLeft);
   removeTree(templateTreeRight);
   removeTree(templateTreeCenter);
 }
 
 function teardownTrees() {
   clearInterval(treeTimer);
   
 }
 
 function addTree(el) {
   numberOfTrees += 1;
   el.id = 'tree-' + numberOfTrees;
   treeContainer.appendChild(el);
 }
 
 function removeTree(tree) {
   tree.parentNode.removeChild(tree);
 }
 
 function addTreeTo(position_index) {
   var template = templates[position_index];
   addTree(template.cloneNode(true));
 }
 
 /**
  * Add any number of trees across different lanes, randomly.
  **/
 function addTreesRandomly(
   {
     probTreeLeft = 0.5,
     probTreeCenter = 0.5,
     probTreeRight = 0.5,
     maxNumberTrees = 2
   } = {}) {
 
   var trees = [
     {probability: probTreeLeft,   position_index: 0},
     {probability: probTreeCenter, position_index: 1},
     {probability: probTreeRight,  position_index: 2},
   ]
   shuffle(trees);
 
   var numberOfTreesAdded = 0;
   var position_indices = [];
   trees.forEach(function (tree) {
     if (Math.random() < tree.probability && numberOfTreesAdded < maxNumberTrees) {
       addTreeTo(tree.position_index);
       numberOfTreesAdded += 1;
 
       position_indices.push(tree.position_index);
     }
   });
 
   if (detectMob()) {
     mirrorVR.notify('addTrees', position_indices);
   }
   return numberOfTreesAdded;
 }
 
 function addTreesRandomlyLoop({intervalLength = 500} = {}) {
   treeTimer = setInterval(addTreesRandomly, intervalLength);
 }
 
 /**************
  * COLLISIONS *
  **************/
 
 const POSITION_Z_OUT_OF_SIGHT = 1;
 const POSITION_Z_LINE_START = 0.6;
 const POSITION_Z_LINE_END = 0.7;
 
 AFRAME.registerComponent('player', {
   tick: function() {
     document.querySelectorAll('.tree').forEach(function(tree) {
       position = tree.getAttribute('position');
       tree_position_index = tree.getAttribute('data-tree-position-index');
       tree_id = tree.getAttribute('id');

       if (position.z > POSITION_Z_OUT_OF_SIGHT) {
         removeTree(tree);
       }
 
       if (!isGameRunning) return;
 
       if (POSITION_Z_LINE_START < position.z && position.z < POSITION_Z_LINE_END
           && tree_position_index == player_position_index) {
         gameOver();
       }
 
       if (position.z > POSITION_Z_LINE_END && !countedTrees.has(tree_id)) {
         addScoreForTree(tree_id);
         updateScoreDisplay();
       }
     })
   }
 });
 
 /*********
  * SCORE *
  *********/
 
 var score;
 var countedTrees;
 var gameOverScoreDisplay;
 var scoreDisplay;
 
 function setupScore() {
   score = 0;
   countedTrees = new Set();
   scoreDisplay = document.getElementById('score');
   gameOverScoreDisplay = document.getElementById('game-score');
 }
 
 function teardownScore() {
   scoreDisplay.setAttribute('value', '');
   gameOverScoreDisplay.setAttribute('value', score);
 }
 
 function addScoreForTree(tree_id) {
   score += 1;
   countedTrees.add(tree_id);
 }
 
 function updateScoreDisplay() {
   scoreDisplay.setAttribute('value', score);
   if (detectMob()) {
     mirrorVR.notify('score', score);
   }
 }
 
 /********
  * MENU *
  ********/
 
 var menuStart;
 var menuGameOver;
 var menuContainer;
 var isGameRunning = false;
 var startButton;
 var restartButton;
 
 function hideEntity(el) {
   el.setAttribute('visible', false);
 }
 
 function showEntity(el) {
   el.setAttribute('visible', true);
 }
 
 function setupAllMenus() {
   menuStart     = document.getElementById('start-menu');
   menuGameOver  = document.getElementById('game-over');
   menuContainer = document.getElementById('menu-container');
   startButton   = document.getElementById('start-button');
   restartButton = document.getElementById('restart-button');
 
   showStartMenu();
 
   startButton.addEventListener('click', function(evt) {
     startGame();
   })
 
   restartButton.addEventListener('click', function(evt) {
     startGame();
   })
 }
 
 function hideAllMenus() {
   hideEntity(menuContainer);
   startButton.classList.remove('clickable');
   restartButton.classList.remove('clickable');
 }
 
 function showGameOverMenu() {
   showEntity(menuContainer);
   hideEntity(menuStart);
   showEntity(menuGameOver);
   startButton.classList.remove('clickable');
   restartButton.classList.add('clickable');
 }
 
 function showStartMenu() {
   showEntity(menuContainer);
   hideEntity(menuGameOver);
   showEntity(menuStart);
   startButton.classList.add('clickable');
   restartButton.classList.remove('clickable');
 }
 
 /************
  * MirrorVR *
  ************/
 
 function setupMirrorVR() {
   mirrorVR.init({
     roomId: 'aquanaut',
     state: {
       startGame: {
         onNotify: function(data) {
           hideAllMenus();
           setupScore();
           updateScoreDisplay();
         }
       },
       gameOver: {
         onNotify: function(data) {
           gameOver();
         }
       },
       addTrees: {
         onNotify: function(position_indices) {
           position_indices.forEach(addTreeTo)
         }
       },
       score: {
         onNotify: function(data) {
           score = data;
           updateScoreDisplay();
         }
       }
     }
   })
 }
 
 /********
  * GAME *
  ********/
 
 function gameOver() {
   isGameRunning = false;
 
   showGameOverMenu();
   teardownTrees();
   teardownScore();
 
   if (detectMob()) {
     mirrorVR.notify('gameOver', {});
   }
 }
 
 function startGame() {
   if (isGameRunning) return;
   isGameRunning = true;
 
   hideAllMenus();
   setupScore();
   updateScoreDisplay();
   addTreesRandomlyLoop();
 
   if (detectMob()) {
     mirrorVR.notify('startGame', {})
   }
 }
 setupControls();  // TODO: AFRAME.registerComponent has to occur before window.onload?
 
 window.onload = function() {
   setupMirrorVR();
   setupAllMenus();
   setupScore();
   setupTrees();
 }
 
 /*************
  * UTILITIES *
  *************/
 
 /**
  * Shuffles array in place.
  * @param {Array} a items An array containing the items.
  */
 function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
 }


 
 /**
  * Checks for mobile and tablet platforms.
  */
 function detectMob() {
  const toMatch = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /iPad/i,
    /iPod/i,
    /BlackBerry/i,
    /Windows Phone/i
];
  return toMatch.some((toMatchItem) => {
  return navigator.userAgent.match(toMatchItem);
});
return ( ( window.innerWidth <= 800 ) && ( window.innerHeight <= 600 ) );
 };
 