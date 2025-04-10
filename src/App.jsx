import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { slideIn, popIn, floatUp, tada, pulse } from "./utils/motion.js";
import pic1 from "./Images/lina/a.jpg";
import pic2 from "./Images/lina/photo_2025-04-06_05-37-45.jpg";
import pic3 from "./Images/lina/photo_2025-04-06_05-38-46.jpg";
import pic4 from "./Images/lina/photo_2025-04-06_05-38-54.jpg";
import pic5 from "./Images/lina/photo_2025-04-06_05-38-57.jpg";
import pic6 from "./Images/lina/photo_2025-04-06_05-40-16.jpg";
import pic7 from "./Images/lina/photofromtik.png";
import pic8 from "./Images/lina/photo_2025-04-06_05-40-19.jpg";
import Confetti from "react-confetti";
import useSound from "use-sound";
import birthdaySong from "./sounds/birthday.mp3";
import popSound from "./sounds/pop.mp3";
import cheerSound from "./sounds/cheer.mp3";
import { useReactMediaRecorder } from "react-media-recorder";
import secretVideo from "./videos/secret-message.mp4";

function App() {
  const [isExploding, setIsExploding] = useState(false);
  const [bgColor, setBgColor] = useState("from-pink-100 to-pink-200");
  const [showSurprise, setShowSurprise] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showSecretMessage, setShowSecretMessage] = useState(false);
  const [showCake, setShowCake] = useState(false);
  const [candlesLit, setCandlesLit] = useState(false);
  const [playBirthday] = useSound(birthdaySong, { volume: 0.5 });
  const [playPop] = useSound(popSound);
  const [playCheer] = useSound(cheerSound);
  const confettiRef = useRef(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [recordingStatus, setRecordingStatus] = useState(
    "Starting recording..."
  );
  const recordedChunks = useRef([]);
  const mediaRecorder = useRef(null);
  const combinedStream = useRef(null);
  const videoRef = useRef(null);

  const colors = [
    "from-purple-200 to-pink-200",
    "from-yellow-100 to-orange-100",
    "from-blue-100 to-teal-100",
    "from-green-100 to-emerald-100",
    "from-rose-100 to-pink-200",
  ];

  const {
    status: cameraStatus,
    startRecording: startCameraRecording,
    stopRecording: stopCameraRecording,
    mediaBlobUrl: cameraBlobUrl,
  } = useReactMediaRecorder({
    video: { facingMode: "user" },
    audio: true,
    blobPropertyBag: { type: "video/mp4" },
    onStop: (blobUrl) => {
      downloadRecording(blobUrl, "camera");
    },
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Start recording automatically when component mounts
    startRecording();

    // Clean up when component unmounts
    return () => {
      stopRecording();
    };
  }, []);

  useEffect(() => {
    // Handle page refresh/close
    const handleBeforeUnload = (e) => {
      if (
        mediaRecorder.current?.state === "recording" ||
        cameraStatus === "recording"
      ) {
        e.preventDefault();
        stopRecording();
        setTimeout(() => {}, 1000);
        return "Recording in progress. Please wait...";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [cameraStatus]);

  useEffect(() => {
    // Auto-play video when secret message opens
    if (showSecretMessage && videoRef.current) {
      videoRef.current
        .play()
        .catch((e) => console.log("Autoplay prevented:", e));
    }
  }, [showSecretMessage]);

  const handleClick = () => {
    setIsExploding(true);
    setBgColor(colors[Math.floor(Math.random() * colors.length)]);
    setClickCount((prev) => prev + 1);
    playPop();

    if (clickCount >= 2 && !showSurprise) {
      setShowSurprise(true);
      playCheer();
    }

    if (clickCount >= 7 && !showCake) {
      setShowCake(true);
      playBirthday();
    }
  };

  const messages = [
    "You're amazing!",
    "Best friend ever!",
    "So talented!",
    "Wonderful person!",
    "Birthday queen! 👑",
    "Gorgeous inside & out!",
    "The life of every party!",
    "Simply irreplaceable!",
    "Heart of pure gold!",
    "World's best Z!",
  ];

  const blowOutCandles = () => {
    setCandlesLit(false);
    setIsExploding(true);
    playCheer();
  };

  const downloadRecording = (blobUrl, type) => {
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `birthday-reaction-${type}-${new Date().toISOString()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setRecordingStatus(`${type} recording saved!`);
    setTimeout(() => setRecordingStatus(""), 3000);
  };

  const startRecording = async () => {
    try {
      setRecordingStatus("Starting camera recording...");
      startCameraRecording();

      if (navigator.mediaDevices?.getDisplayMedia) {
        const screenStream = await navigator.mediaDevices
          .getDisplayMedia({
            video: true,
            audio: true,
          })
          .catch((err) => {
            setRecordingStatus(
              "Camera recording only (screen sharing cancelled)"
            );
            return null;
          });

        if (screenStream) {
          const cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: true,
          });

          combinedStream.current = new MediaStream([
            ...screenStream.getVideoTracks(),
            ...cameraStream.getVideoTracks(),
            ...cameraStream.getAudioTracks(),
          ]);

          recordedChunks.current = [];
          mediaRecorder.current = new MediaRecorder(combinedStream.current);

          mediaRecorder.current.ondataavailable = (e) => {
            if (e.data.size > 0) {
              recordedChunks.current.push(e.data);
            }
          };

          mediaRecorder.current.onstop = () => {
            const blob = new Blob(recordedChunks.current, {
              type: "video/mp4",
            });
            const url = URL.createObjectURL(blob);
            downloadRecording(url, "combined");
          };

          mediaRecorder.current.start();
          setRecordingStatus("Recording screen and camera...");
        }
      }
    } catch (error) {
      console.error("Recording failed:", error);
      setRecordingStatus(`Recording error: ${error.message}`);
    }
  };

  const stopRecording = () => {
    setRecordingStatus("Saving recording...");

    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.stop();
    }

    stopCameraRecording();

    if (combinedStream.current) {
      combinedStream.current.getTracks().forEach((track) => track.stop());
      combinedStream.current = null;
    }
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br transition-all duration-1000 ${bgColor} overflow-hidden relative`}
    >
      {/* Recording status indicator */}
      <div className="fixed top-4 right-4 bg-black bg-opacity-70 text-white px-3 py-1 rounded-full text-sm z-50">
        {recordingStatus}
        {cameraStatus === "recording" ||
        mediaRecorder.current?.state === "recording" ? (
          <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        ) : null}
      </div>

      {/* Interactive background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{
              duration: 3 + Math.random() * 5,
              delay: Math.random() * 10,
              repeat: Infinity,
              repeatDelay: Math.random() * 15,
            }}
            className="absolute text-yellow-300 text-xl"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          >
            ✨
          </motion.div>
        ))}
      </div>

      {/* Confetti explosion */}
      {isExploding && (
        <div className="fixed inset-0 flex justify-center items-center pointer-events-none z-50">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            numberOfPieces={300}
            recycle={false}
            onConfettiComplete={() => setIsExploding(false)}
            ref={confettiRef}
          />
        </div>
      )}

      {/* Floating balloons */}
      <AnimatePresence>
        {showSurprise && (
          <>
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`balloon-${i}`}
                initial={{ y: "100vh", x: `${Math.random() * 100}vw` }}
                animate={{
                  y: `-${Math.random() * 100}vh`,
                  x: `${Math.random() * 20 - 10}vw`,
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 15 + Math.random() * 15,
                  repeat: Infinity,
                  repeatType: "loop",
                }}
                className="absolute text-4xl cursor-pointer z-10"
                style={{ left: `${Math.random() * 100}%` }}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.8 }}
                onClick={() => playPop()}
              >
                {i % 3 === 0 ? "🎈" : i % 3 === 1 ? "🎉" : "🎁"}
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Birthday cake */}
      {showCake && (
        <motion.div
          initial={{ y: 300, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 flex justify-center z-30"
        >
          <div className="relative">
            <motion.div
              className="text-6xl cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onClick={blowOutCandles}
            >
              🎂
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full flex">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={`candle-${i}`}
                    animate={
                      candlesLit
                        ? { opacity: 1, y: [0, -5, 0] }
                        : { opacity: 0 }
                    }
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="mx-1"
                  >
                    {candlesLit ? "🕯️" : "🔥"}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Enhanced Secret Message with Video */}
      {showSecretMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowSecretMessage(false)}
        >
          <motion.div
            className="bg-gradient-to-br from-pink-500 to-purple-600 p-6 rounded-2xl max-w-4xl w-full mx-4 shadow-2xl border-2 border-white"
            variants={popIn(0.2, 1)}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                <motion.h2
                  className="text-3xl font-bold mb-4 text-white text-center"
                  variants={tada}
                >
                  A Special Video Message For You! 💖
                </motion.h2>

                <div className="relative w-[260px] h-[340px] rounded-xl overflow-hidden bg-black shadow-lg">
                  <video
                    ref={videoRef}
                    src={secretVideo}
                    controls
                    autoPlay
                    muted
                    playsInline
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none"></div>
                </div>
              </div>

              <div className="flex-1 flex flex-col">
                <motion.div
                  className="bg-white bg-opacity-20 p-6 rounded-lg flex-1 flex flex-col justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="text-2xl font-bold text-black mb-4">
                    Dear Z,
                  </h3>
                  <div className="space-y-3">
                    <p className="text-black text-lg">
                      <span className="text-yellow-300">✨</span> You light up
                      every room you enter with your amazing energy!
                    </p>
                    <p className="text-black text-lg">
                      <span className="text-pink-300">🎂</span> On your special
                      day, I hope you feel all the love and happiness you bring
                      to others.
                    </p>
                    <p className="text-black text-lg">
                      <span className="text-purple-500">🎉</span> Wishing you
                      the most incredible birthday yet!
                    </p>
                  </div>
                </motion.div>

                <div className="mt-6 flex justify-center">
                  <motion.button
                    className="bg-white text-pink-600 font-bold py-3 px-8 rounded-full flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowSecretMessage(false);
                      playCheer();
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 01-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Close Message
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 relative z-20">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="text-center"
        >
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600"
            variants={pulse}
          >
            Happy Birthday Z!! 🎉
          </motion.h1>
          <motion.p
            className="text-xl text-pink-700 mb-8"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Wishing you the most magical day filled with love and joy!
          </motion.p>
        </motion.div>

        {/* Interactive buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <motion.button
            onClick={handleClick}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-full shadow-xl text-xl transition-all"
            whileHover={{
              scale: 1.1,
              boxShadow: "0 0 20px rgba(236, 72, 153, 0.7)",
            }}
            whileTap={{ scale: 0.9 }}
          >
            🎂 Birthday Magic Button 🎂
          </motion.button>

          {clickCount > 3 && (
            <motion.button
              onClick={() => {
                setShowSecretMessage(true);
                playCheer();
              }}
              className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-full shadow-lg"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              💝 Open Special Message
            </motion.button>
          )}

          {clickCount > 5 && (
            <motion.button
              onClick={() => {
                setCandlesLit(!candlesLit);
                playPop();
              }}
              className="bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-full shadow-lg"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {candlesLit ? "💨 Blow Out Candles" : "🔥 Light Candles"}
            </motion.button>
          )}
        </div>

        {/* Birthday messages with photos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {[
            {
              img: pic1,
              text: "Happy birthday to you, my dear friend! I hope this year brings you all the happiness and success you deserve.",
              dir: "left",
              emoji: "🥳",
            },
            {
              img: pic2,
              text: "May your day be filled with love, laughter, and unforgettable memories. You are such a special person in my life, and I am grateful for your friendship.",
              dir: "right",
              emoji: "😊",
            },
            {
              img: pic3,
              text: "Thank you for always being there for me and for all the wonderful moments we have shared together.",
              dir: "left",
              emoji: "💖",
            },
            {
              img: pic4,
              text: "Enjoy your special day to the fullest! Remember that you are loved and cherished by so many people.",
              dir: "right",
              emoji: "🎁",
            },
            {
              img: pic5,
              text: "May this birthday be the best one yet, filled with all the things you love. I can't wait to celebrate with you!",
              dir: "left",
              emoji: "🎀",
            },
            {
              img: pic6,
              text: "Cheers to you, Z! You are truly one of a kind, and I am so lucky to have you in my life.",
              dir: "right",
              emoji: "🥂",
            },
            {
              img: pic7,
              text: "I hope this year brings you everything you have been wishing for and more. You deserve all the happiness in the world!",
              dir: "left",
              emoji: "🌈",
            },
            {
              img: pic8,
              text: "So go out there and celebrate like there's no tomorrow! Here's to another year of adventures and beautiful memories.",
              dir: "right",
              emoji: "✨",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "0px 0px -100px 0px" }}
              variants={slideIn(item.dir, "spring", index * 0.1, 0.8)}
              className={`flex ${
                item.dir === "right" ? "flex-row-reverse" : "flex-row"
              } items-center justify-center p-6 rounded-3xl bg-white bg-opacity-80 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all`}
              whileHover={{ y: -5 }}
            >
              <motion.div
                className={`relative ${
                  item.dir === "right" ? "ml-6" : "mr-6"
                } group`}
                whileHover={{ scale: 1.05 }}
              >
                <motion.img
                  src={item.img}
                  alt="Birthday"
                  className="w-40 h-52 md:w-48 md:h-64 rounded-xl shadow-md object-cover border-4 border-white"
                />
                <motion.div
                  className="absolute -bottom-4 -right-4 bg-pink-500 text-white text-2xl w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                  variants={tada}
                >
                  {item.emoji}
                </motion.div>
              </motion.div>
              <motion.p
                className="text-base md:text-lg text-center w-48 md:w-60 p-4 text-gray-800 font-medium"
                variants={floatUp(0.5, 1)}
              >
                {item.text}
              </motion.p>
            </motion.div>
          ))}
        </div>

        {/* Floating compliment bubbles */}
        <div className="fixed bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none z-10">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={`compliment-${i}`}
              initial={{ y: 0, x: `${Math.random() * 100}%`, opacity: 0 }}
              animate={{
                y: -1000,
                x: `${Math.random() * 30 - 15 + 50}%`,
                opacity: [0, 1, 0],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 8 + Math.random() * 10,
                delay: Math.random() * 15,
                repeat: Infinity,
                repeatDelay: Math.random() * 20,
              }}
              className="absolute bg-gradient-to-r from-pink-400 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-md"
            >
              {messages[Math.floor(Math.random() * messages.length)]}
            </motion.div>
          ))}
        </div>

        {/* Final surprise after all interactions */}
        {clickCount > 10 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-10 left-0 right-0 flex justify-center z-40"
          >
            <motion.div
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setIsExploding(true);
                playCheer();
              }}
            >
              <span className="mr-2">🎊</span>
              Click for Final Surprise!
              <span className="ml-2">🎊</span>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default App;
