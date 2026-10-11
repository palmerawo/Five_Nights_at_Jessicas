
(() => {
  const $ = id => document.getElementById(id);

  const sceneIds = [
  'title',
  'glitch',
  'bonnieScene',
  'nextScene',
  'jessicaWorld'
];

  // Diálogos e imágenes de Bonnie.
  const dialogues = [
    {
      image: 'bonnie-normal.png',
      text: 'Bip... bip... ¿Hola? ¿Hay alguien ahí?',
      sound: 440
    },
    {
      image: 'bonnie-approach.png',
      text: 'Vaya, vaya... así que tú eres Jessica.',
      sound: 220
    },
    {
      image: 'bonnie-guitar.png',
      text: 'Te estábamos esperando. Esta noche no es como las demás...',
      sound: 330
    },
    {
      image: 'bonnie-point.png',
      text: 'Hay algo especial preparado para ti. Quiero que lo descubras poco a poco.',
      sound: 520
    },
    {
      image: 'bonnie-closeup.png',
      text: 'Jessica... ¿estás lista para descubrir lo que tengo preparado?',
      sound: 440
    },
    {
      image: 'bonnie-wink.png',
      text: 'Entonces... ¡que comience nuestra aventura! ♥',
      sound: 660
    }
  ];

  let index = 0;
  let typing = false;
  let timer = null;
  let soundOn = true;
  let ctx = null;
  let menuIndex = 0;
  let sequenceTimer = null;
  let toastTimer = null;
  
  let ambientOscillators = [];
  let ambientGain = null;

  function startAmbient() {
    if (!soundOn || ambientOscillators.length > 0) return;

    const c = audio();
    if (!c) return;

    ambientGain = c.createGain();
    ambientGain.gain.value = 0.012;
    ambientGain.connect(c.destination);

    [48, 50.5].forEach((frequency, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();

      osc.type = i === 0 ? 'sawtooth' : 'sine';
      osc.frequency.value = frequency;
      gain.gain.value = i === 0 ? 0.20 : 0.35;

      osc.connect(gain);
      gain.connect(ambientGain);
      osc.start();

      ambientOscillators.push(osc);
    });
  }

  function stopAmbient() {
    ambientOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (error) {}
    });

    ambientOscillators = [];

    if (ambientGain) {
      ambientGain.disconnect();
      ambientGain = null;
    }
  }


  // Cambiar de escena.
  function scene(id) {
    sceneIds.forEach(sceneId => {
      const element = $(sceneId);
      if (element) {
        element.classList.toggle('active', sceneId === id);
      }
    });
  }

  // Sistema de sonido.
  function audio() {
    if (!soundOn) return null;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return null;

    if (!ctx) ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    return ctx;
  }

  function beep(freq = 440, dur = 0.05, type = 'square', vol = 0.02) {
    const c = audio();
    if (!c) return;

    const oscillator = c.createOscillator();
    const gain = c.createGain();

    oscillator.type = type;
    oscillator.frequency.value = freq;

    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      c.currentTime + dur
    );

    oscillator.connect(gain);
    gain.connect(c.destination);

    oscillator.start();
    oscillator.stop(c.currentTime + dur);
  }

  function staticSound() {
    beep(180, 0.12, 'sawtooth', 0.035);

    setTimeout(() => {
      beep(95, 0.18, 'square', 0.025);
    }, 75);

    setTimeout(() => {
      beep(510, 0.08, 'square', 0.02);
    }, 170);
  }

  
function triggerCameraGlitch() {
  const camera = $('bonnieScene');
  if (!camera) return;

  // Evitar acumular efectos.
  const oldOverlay = camera.querySelector('.camera-glitch-overlay');
  if (oldOverlay) oldOverlay.remove();

  camera.classList.remove('camera-glitch');

  const overlay = document.createElement('div');
  overlay.className = 'camera-glitch-overlay';
  camera.appendChild(overlay);

  // Reiniciar la animación incluso en clics rápidos.
  void camera.offsetWidth;
  camera.classList.add('camera-glitch');

  setTimeout(() => {
    overlay.remove();
    camera.classList.remove('camera-glitch');
  }, 400);
}

  // Cambiar la imagen de Bonnie y su retrato.
  function setBonniePose(filename) {
    const mainImage = document.querySelector('.bonnie-sprite');
    const portrait = document.querySelector('.dialogue-portrait img');
    const path = `assets/${filename}`;

    if (mainImage) {
      mainImage.onerror = () => {
        console.error('No se encontró la imagen de Bonnie:', path);
      };

      mainImage.src = path;
      mainImage.alt = 'Bonnie';
    } else {
      console.error('No existe el elemento .bonnie-sprite en index.html');
    }

    if (portrait) {
      portrait.onerror = () => {
        console.error('No se encontró la imagen del retrato:', path);
      };

      portrait.src = path;
      portrait.alt = 'Bonnie';
    }

    // Reiniciar las animaciones de cada pose.
    const characterScene = $('bonnieScene');

    if (characterScene) {
      characterScene.classList.remove(
        'stage-approach',
        'stage-guitar',
        'stage-point',
        'stage-closeup',
        'stage-wink'
      );

      const stages = {
        'bonnie-approach.png': 'stage-approach',
        'bonnie-guitar.png': 'stage-guitar',
        'bonnie-point.png': 'stage-point',
        'bonnie-closeup.png': 'stage-closeup',
        'bonnie-wink.png': 'stage-wink'
      };

      const stage = stages[filename];

      if (stage) {
        characterScene.classList.add(stage);
      }
    }
  }

  // Mostrar el diálogo letra por letra.
  function typeLine() {
    clearInterval(timer);

    const current = dialogues[index];
    if (!current) return;

    typing = true;

    $('dialogueText').textContent = '';
    $('next').classList.remove('visible');

   triggerCameraGlitch();
setBonniePose(current.image);
beep(current.sound, 0.1, 'triangle', 0.018);

    let i = 0;

    timer = setInterval(() => {
      $('dialogueText').textContent =
        current.text.slice(0, i + 1);

      if (
        current.text[i] &&
        current.text[i] !== ' ' &&
        i % 3 === 0
      ) {
        beep(530 + Math.random() * 100, 0.018, 'square', 0.006);
      }

      i++;

      if (i >= current.text.length) {
        clearInterval(timer);
        typing = false;
        $('next').classList.add('visible');
      }
    }, 28);
  }

  // Avanzar el diálogo.
  function advance() {
    if (typing) {
      clearInterval(timer);

      $('dialogueText').textContent = dialogues[index].text;
      typing = false;
      $('next').classList.add('visible');

      return;
    }

    index++;

    if (index < dialogues.length) {
      typeLine();
   
    } else {
      clearInterval(timer);

      const music = $('fnafMusic');

      if (music) {
        music.pause();
        music.currentTime = 0;
      }

      stopAmbient();
      // 🎵 Iniciar música romántica después de Bonnie
const romanticMusic = $('romanticMusic');

if (romanticMusic && soundOn) {
  romanticMusic.volume = 0.35;

  romanticMusic.currentTime = 0;

  romanticMusic.play().catch(error => {
    console.warn('No se pudo reproducir la música romántica:', error);
  });
}


      scene('nextScene');

      beep(660, 0.12, 'triangle', 0.025);

      setTimeout(() => {
        beep(880, 0.16, 'triangle', 0.02);
      }, 180);
      

setTimeout(() => {
  scene('jessicaWorld');
  $('storyIntro').classList.remove('hidden');
}, 6500);

      
setTimeout(() => {
  const title = $('endingTitle');
  const text = $('endingText');

  if (title && text) {
    title.textContent = 'ARCHIVO DESCONOCIDO // 011';
    text.textContent = 'Hay algo que quiero mostrarte... 💙';
  }
}, 3500);

    }

  }

  // Iniciar una nueva partida.
 
function start() {
  clearInterval(timer);
  clearTimeout(sequenceTimer);

  index = 0;
  typing = false;

  $('dialogueText').textContent = '';
  $('next').classList.remove('visible');

  // Iniciar la música de FNAF.
  const music = $('fnafMusic');

  if (music && soundOn) {
    music.volume = 0.25;
    music.currentTime = 0;

    music.play().catch(error => {
      console.warn('No se pudo iniciar la música:', error);
    });
  }

  // Efecto de interferencia.
  document.body.classList.add('glitching');
  staticSound();
  scene('glitch');

  // Mostrar a Bonnie después de la interferencia.
  sequenceTimer = setTimeout(() => {
    document.body.classList.remove('glitching');
    scene('bonnieScene');

    startAmbient();
    typeLine();
  }, 1350);
}


  // Mensajes emergentes.
  function toast(message) {
    clearTimeout(toastTimer);

    $('toast').textContent = message;
    $('toast').classList.add('show');

    toastTimer = setTimeout(() => {
      $('toast').classList.remove('show');
    }, 2400);
  }

  // Ventana de opciones.
  function openModal() {
    $('modal').classList.add('open');
  }

  function closeModal() {
    $('modal').classList.remove('open');
  }


  // ===== CONECTAR BOTONES DE FORMA SEGURA =====

  function connectButton(id, callback) {
    const element = $(id);

    if (element) {
      element.onclick = callback;
    } else {
      console.warn(`No se encontró el elemento #${id}`);
    }
  }

  connectButton('newGame', start);

  connectButton('continue', () => {
    toast('Todavía no hay una noche guardada. ¡Empieza una nueva partida!');
  });

  connectButton('options', openModal);
  connectButton('next', advance);

  connectButton('discover', () => {
    toast('La siguiente aventura está en preparación... ❤️');
  });

  connectButton('close', closeModal);
  connectButton('okay', closeModal);

  const modal = $('modal');

  if (modal) {
    modal.onclick = event => {
      if (event.target === modal) {
        closeModal();
      }
    };
  }


  // Activar o desactivar sonidos.
  
  $('sound').onchange = event => {
    soundOn = event.target.checked;

    if (soundOn) {
      beep(620, 0.08, 'square', 0.025);
      startAmbient();
    } else {
      stopAmbient();
    }
  };


  // Efectos al pasar por las opciones del menú.
  document.querySelectorAll('.menu').forEach((button, i) => {
    button.onmouseenter = () => {
      document.querySelectorAll('.menu').forEach(item => {
        item.classList.remove('selected');
      });

      button.classList.add('selected');
      menuIndex = i;

      beep(320, 0.025, 'square', 0.01);
    };
  });

  // Controles del teclado.
  document.addEventListener('keydown', event => {
    if ($('modal').classList.contains('open')) {
      if (event.key === 'Escape') {
        closeModal();
      }

      return;
    }

    if ($('title').classList.contains('active')) {
      if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();

        const buttons = [...document.querySelectorAll('.menu')];

        if (buttons.length) {
          menuIndex = (
            menuIndex +
            (event.key === 'ArrowDown' ? 1 : -1) +
            buttons.length
          ) % buttons.length;

          buttons.forEach((button, i) => {
            button.classList.toggle('selected', i === menuIndex);
          });

          beep(320, 0.025, 'square', 0.01);
        }
      }

      if (event.key === 'Enter') {
        const buttons = document.querySelectorAll('.menu');

        if (buttons[menuIndex]) {
          buttons[menuIndex].click();
        }
      }
    } else if (
      $('bonnieScene').classList.contains('active') &&
      ['Enter', ' '].includes(event.key)
    ) {
      event.preventDefault();
      advance();
    }

    if (event.key === 'Escape') {
      closeModal();
    }
  });

  // Parpadeo del reloj.
  setInterval(() => {
    const clock = $('clock');

    if (clock) {
      clock.style.opacity =
        clock.style.opacity === '0.65' ? '1' : '0.65';
    }
  }, 1400);
  
  // Entrada al mundo de Jessica.
  $('heartReveal').onclick = () => {
    $('loveMessage').classList.add('open');
    beep(660, 0.12, 'triangle', 0.025);
    setTimeout(() => beep(880, 0.18, 'sine', 0.025), 150);
  };

 
/* ===== GENERADOR DE ESTRELLAS FUGACES ===== */

let shootingStarTimer = null;

function launchShootingStar() {
  const finalScene = document.getElementById('finalLoveScene');

  if (!finalScene || !finalScene.classList.contains('show')) return;

  const star = document.createElement('span');
  star.className = 'shooting-star';

  star.style.setProperty('--star-top', `${8 + Math.random() * 48}%`);
  star.style.setProperty('--star-left', `${45 + Math.random() * 55}%`);

  finalScene.appendChild(star);

  setTimeout(() => star.remove(), 1200);
}

function startShootingStars() {
  clearTimeout(shootingStarTimer);

  function scheduleNextStar() {
    shootingStarTimer = setTimeout(() => {
      launchShootingStar();

      // A veces aparece una segunda estrella poco después.
      if (Math.random() < 0.25) {
        setTimeout(launchShootingStar, 500);
      }

      scheduleNextStar();
    }, 3500 + Math.random() * 5000);
  }

  scheduleNextStar();
}

startShootingStars();


$('closeLoveMessage').onclick = () => {
  $('loveMessage').classList.remove('open');

  const finalScene = $('finalLoveScene');

  if (finalScene) {
    finalScene.classList.add('show');
    beep(660, 0.15, 'sine', 0.025);
    setTimeout(() => beep(880, 0.2, 'sine', 0.02), 180);
  }
};

const goToSpace = document.getElementById('goToSpace');

if (goToSpace) {
  goToSpace.addEventListener('click', () => {
    const garden = document.getElementById('jessicaWorld');
    const space = document.getElementById('spaceScene');

    if (garden) garden.classList.remove('active');
    if (space) space.classList.add('active');

    beep(660, 0.15, 'sine', 0.025);
    setTimeout(() => beep(880, 0.2, 'sine', 0.02), 180);
  });
}



 // Botón para pasar del capítulo espacial a la escena final.
const spaceContinue = $('spaceContinue');

if (spaceContinue) {
  spaceContinue.onclick = () => {
    const space = $('spaceScene');
    const camera = $('cameraScene');

    if (space) space.classList.remove('active');
    if (camera) camera.classList.add('active');

    beep(660, 0.15, 'sine', 0.025);
    setTimeout(() => beep(880, 0.2, 'sine', 0.02), 180);
  };
}



  // Detalles personalizados de Jessica.
  const cardDetails = {
    morat: {
      title: 'Un poquito de Morat ♫',
      text: 'Hay canciones que empiezan a tener otro significado cuando las relacionamos con una persona.'
    },
    tulips: {
      title: 'Un jardín para ti 🌷',
      text: 'Entre todas las flores, quería reservarte un pequeño jardín lleno de color y cariño.'
    },
    bonnie: {
      title: 'Bonnie está de guardia 💜',
      text: 'Después de tanto misterio, hasta nuestro guardián tiene una misión: cuidar este pequeño mundo.'
    },
    rubius: {
      title: '¡Modo gamer activado! 🎮',
      text: 'Toda gran aventura necesita personajes especiales, secretos por descubrir y muchas sorpresas.'
    },
    jl: {
      title: '11/01 - J&L ♥',
      text: 'Una fecha, Dos iniciales y una historia, en la que nuestras vidas empezaron a cruzarse de una manera que ninguno de los dos imaginaba.'
    }
  };

  document.querySelectorAll('.jessica-card').forEach(card => {
    card.addEventListener('click', () => {
      const detail = cardDetails[card.dataset.card];
      if (!detail) return;

      $('popupTitle').textContent = detail.title;
      $('popupText').textContent = detail.text;
      $('cardPopup').classList.add('open');

      if (typeof beep === 'function') {
        beep(660, 0.1, 'triangle', 0.02);
      }
    });
  });

  $('closeCardPopup').onclick = () => {
    $('cardPopup').classList.remove('open');
  };

  // Continuar desde la narración hacia el jardín.
 


let storyPage = 1;


function showStoryPage2() {
  const storyText = document.querySelector('.story-text');

  if (!storyText) {
    alert('ERROR: No encuentro .story-text');
    return;
  }

  storyText.innerHTML = `
    <p class="story-eyebrow">ARCHIVO J&amp;L // LO QUE SENTÍAMOS</p>

    <p class="story-line">
      Pero la distancia nunca consiguió impedir
      que te sintiera cerca.
    </p>

    <p class="story-line story-ending">
      Y con cada conversación, cada risa y cada momento...
    </p>

    <p class="story-line story-distance">
      te fui queriendo más. ❤️
    </p>

    <button id="storyContinue" type="button">
      CONTINUAR ❤️
    </button>
  `;

  document.getElementById('storyContinue').onclick = showNextStory;
}

function showNextStory() {
  const intro = document.getElementById('storyIntro');

  if (intro) {
    intro.classList.add('hidden');
  }
}

document.addEventListener('click', function(event) {
  const button = event.target.closest('#storyContinue');

  if (!button) return;

  event.preventDefault();

  const storyText = document.querySelector('.story-text');
  const secondPageVisible =
    storyText && storyText.textContent.includes('te sintiera cerca');

  if (secondPageVisible) {
    showNextStory();
  } else {
    showStoryPage2();
  }
});

})();
