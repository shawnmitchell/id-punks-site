import React, {useState, useEffect} from 'react';
import { FormControl, FormControlLabel, FormLabel, RadioGroup, Radio } from '@material-ui/core';
import mergeImages from 'merge-images';
import {ethers} from 'ethers';
import './App.css';
import { API } from 'aws-amplify';
import RealIDPunks from './contracts/RealIDPunks.json';
import { WebcamCapture } from './components/webcam';

const CONTRACT_ADDRESS = "0xF2Ec1cF88e39a37eBd40250D33a024f98d760fEf";

interface Proof {
  index: number;
  key: string;
  value: string;
  proof: string[];
}

interface ColorChipProps {
  color: string;
}

const ColorChip = ({color}: ColorChipProps) => {
  return (
    <div style={{height: 24, width: 24, borderRadius: 12, backgroundColor: color}} />
  )
}

function App() {
  const [img, setImg] = useState<string>();
  const [background, setBackground] = useState<string>('./assets_two/backgrounds/blue.png');
  const [eyes, setEyes] = useState<string>('./assets_two/eyes/blue.png');
  const [hairLength, setHairLength] = useState<'short' | 'long'>('short');
  const [hairColor, setHairColor] = useState<string>('Bald');
  const [sweatband, setSweatband] = useState<string>('none');
  const [skintone, setSkintone] = useState<string>('./assets_two/skintones/brown.png');
  const [mouth, setMouth] = useState<string>('./assets_two/mouths/NormalMouth.png');
  const [jewelry, setJewelry] = useState<string>('./assets_two/hair/short/Bald.png');
  const [accessory, setAccessory] = useState<string>('./assets_two/hair/short/Bald.png');
  const [facialHair, setFacialHair] = useState<string>('./assets_two/hair/short/Bald.png');
  const [selfie, setSelfie] = useState<string>();
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [walletAddress, setWalletAddress] = useState<string>();
  const [eyewear, setEyewear] = useState<string>('./assets_two/hair/short/Bald.png');
  const [fetching, setFetching] = useState<boolean>(false);
  const [proofs, setProofs] = useState<Proof[]>([]);

  useEffect(() => {
    
    (async() => {
      // @ts-ignore
      const {ethereum} = window;
      if (!!ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const _signer = provider.getSigner();
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        setWalletAddress(accounts[0]);
        let chainId = await ethereum.request({ method: 'eth_chainId' });
        console.log("Connected to chain " + chainId);
        const punks = new ethers.Contract(CONTRACT_ADDRESS, RealIDPunks.abi, _signer);
        // const result = await punks.
        punks.on('Transfer', (event) => {
          console.log(event);
        })

        return () => punks.off('Transfer', () => {});
      }
      

    })();
  }, []);

  useEffect(() => {
    (async () => {
      console.log(window.location.href);
      console.log(sweatband);
      console.log(hairLength);
      const hair = `./assets_two/hair/${hairLength}/${hairColor}.png`;
      const headband = sweatband === 'none' ? './assets_two/hair/short/Bald.png' : `./assets_two/hats/${hairLength === 'long' && hairColor !== 'bald' ? 'LongHair' : ''}${sweatband}Sweatband.png`;
      console.log(headband);
      try {
        // ORDER MATTERS HERE - from back to front please
        const result = await mergeImages([
          background, 
          skintone, 
          './assets_two/PunkBaseGirl.png', 
          mouth, 
          './assets_two/nose.png', 
          eyes, 
          hair,
          facialHair,
          headband,
          eyewear,
          jewelry,
          accessory,
        ]);
        setImg(result);
        console.log(result);
      } catch (error) {
        console.log(error);
      }
    })();
  }, [background, eyes, skintone, mouth, jewelry, accessory, eyewear, facialHair, hairLength, hairColor, sweatband])



  
  const takeSelfie = () => {
    setShowCamera(true);
  }

  const handleCapture = (imgSrc: string) => {
    setSelfie(imgSrc);
    setShowCamera(false);
  }

  const submit = async () => {
    const result = await API.post('mintPunk', '/', {
      body: {
        address: walletAddress,
        proofs,
        selfie: selfie?.split(',')[1]
        }
    })
    console.log(result);
  }

  const handlePaste = async () => {
    try {
      const payload = await navigator.clipboard.readText();
      const parsed = JSON.parse(payload);
      console.log(parsed);
      const gender = parsed.find((item: Proof) => item.key === 'Sex');
      setHairLength(gender.value === 'M' ? 'short' : 'long');
      parsed.forEach((p: Proof) => {
        const {key, value, index, proof} = p;

        switch (key) {
          case 'EyeColor':
            setEyes(`./assets_two/eyes/${value.toLowerCase()}.png`);
            break;
          case 'HairColor':
            setHairColor(value.toLowerCase());
            break;
          case 'GeographicOrigin': 
            switch (value) {
              case 'EUROPEAN':
                setSkintone('./assets_two/skintones/pink.png');
                break;
                case 'EASTASIAN':
                  setSkintone('./assets_two/skintones/asian.png');
                  break;
                case 'SOUTHASIAN':
                  setSkintone('./assets_two/skintones/tan.png');
                  break;
                case 'AFRICAN':
                  setSkintone('./assets_two/skintones/brown.png');
                  break;
                default:
                  break;
              }
            break;
          case 'Emotion':
            switch(value) {
              case 'JOY':
                setMouth(gender.value === 'M' ? './assets_two/mouths/happy.png' : './assets_two/mouths/SmirkLipstickMouth.png');
                break;
              case 'Sadness':
                setMouth(gender.value === 'M' ? './assets_two/mouths/mad.png' : './assets_two/mouths/BoredLipstickMouth.png');
                break;
              default:
                setMouth(gender.value === 'M' ? './assets_two/mouths/stoic.png' : './assets_two/mouths/NormalLipstickMouth.png')
                break;
            }
            break;
          case 'FacialHair': 
            setFacialHair(value === '0' ? './assets_two/hair/short/Bald.png' : './assets_two/beard.png')
            break;
          default:
            console.log(key, value);
            break;
        }
      })
    } catch(error) {
      console.log(error);
    }
  }

  return (
    <div className="App">
      <div className="SelfieGroup">
        { showCamera ? (<WebcamCapture onCapture={handleCapture} />) : (
        <>
          {!!selfie ? (
          <>  
            <img src={selfie} alt='none' className="Selfie" />
            <button onClick={submit}>Submit</button>
            <button onClick={takeSelfie}>Retake Selfie</button>
          </>
          ) : (
            <button onClick={takeSelfie}>Take Selfie</button>
          )}
        </>
        ) }
        {!!fetching ? (
          <button onClick={handlePaste}>Paste Data Here</button>
        ) : (
          <a href='https://master.d1pxugyx19c9zm.amplifyapp.com/?request=[FacialHair,GeographicOrigin,Sex,Emotion,EyeColor,HairColor]' target="_blank" rel="noreferrer noopener">
            <button onClick={() => setFetching(true)}>Share Eye & Hair Color</button>
          </a> 
        )}
      </div>
      {!!img && (
        <img alt='oops' src={img} height='400px' style={{margin: '4px'}} />
      )}
      <div>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Skin Tone</FormLabel>
        <RadioGroup aria-label="skin tone" name="skintone" value={skintone} onChange={(_, val) => setSkintone(val)}>
          <FormControlLabel value='./assets_two/skintones/pink.png' control={<Radio />} label={<ColorChip color='#FFCDD2' />} />
          <FormControlLabel value='./assets_two/skintones/asian.png' control={<Radio />} label={<ColorChip color='#E3CAB1' />} />
          <FormControlLabel value='./assets_two/skintones/tan.png' control={<Radio />} label={<ColorChip color='#CFA890' />} />
          <FormControlLabel value='./assets_two/skintones/brown.png' control={<Radio />} label={<ColorChip color='#5C4036' />} />
          <FormControlLabel value='./assets_two/skintones/alien.png' control={<Radio />} label={<ColorChip color='#F0BBFA' />} />
          <FormControlLabel value='./assets_two/skintones/zombie.png' control={<Radio />} label={<ColorChip color='#FC6868' />} />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Background</FormLabel>
        <RadioGroup aria-label="background" name="background" value={background} onChange={(_, val) => setBackground(val)}>
          <FormControlLabel value='./assets_two/backgrounds/BlueSky.png' control={<Radio />} label="BlueSky" />
          <FormControlLabel value='./assets_two/backgrounds/Gray.png' control={<Radio />} label="Gray" />
          <FormControlLabel value='./assets_two/backgrounds/Green.png' control={<Radio />} label="Green" />
          <FormControlLabel value='./assets_two/backgrounds/Blue.png' control={<Radio />} label="Blue" />
          <FormControlLabel value='./assets_two/backgrounds/Orange.png' control={<Radio />} label="Orange" />
          <FormControlLabel value='./assets_two/backgrounds/Pink.png' control={<Radio />} label="Pink" />
          <FormControlLabel value='./assets_two/backgrounds/Purple.png' control={<Radio />} label="Purple" />
          <FormControlLabel value='./assets_two/backgrounds/StarryNight.png' control={<Radio />} label="Starry Night" />
          <FormControlLabel value='./assets_two/backgrounds/Wordle.png' control={<Radio />} label="Wordle" />
          <FormControlLabel value='./assets_two/backgrounds/BackgroundUkraine.png' control={<Radio />} label="Ukraine" />
          <FormControlLabel value='./assets_two/backgrounds/Sunrise.png' control={<Radio />} label="Sunrise" />
          <FormControlLabel value='./assets_two/backgrounds/Sunset.png' control={<Radio />} label="Sunset" />
          <FormControlLabel value='./assets_two/backgrounds/Alps.png' control={<Radio />} label="Alps" />
          <FormControlLabel value='./assets_two/backgrounds/Crazy.png' control={<Radio />} label="Crazy" />
          <FormControlLabel value='./assets_two/backgrounds/Rainbow.png' control={<Radio />} label="Rainbow" />
          <FormControlLabel value='./assets_two/backgrounds/Night.png' control={<Radio />} label="Night" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Eye Color</FormLabel>
        <RadioGroup aria-label="eye color" name="skintone" value={eyes} onChange={(_, val) => setEyes(val)}>
          <FormControlLabel value='./assets_two/eyes/blue.png' control={<Radio />} label="Blue" />
          <FormControlLabel value='./assets_two/eyes/gray.png' control={<Radio />} label="Gray" />
          <FormControlLabel value='./assets_two/eyes/brown.png' control={<Radio />} label="Brown" />
          <FormControlLabel value='./assets_two/eyes/hazel.png' control={<Radio />} label="Hazel" />
          <FormControlLabel value='./assets_two/eyes/green.png' control={<Radio />} label="Green" />
          <FormControlLabel value='./assets_two/eyes/zombie.png' control={<Radio />} label="Zombie" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Hair Color</FormLabel>
        <RadioGroup aria-label="hair" name="haircolor" value={hairColor} onChange={(_, val) => {
            // @ts-ignore
            setHairColor(val);
          }}>
          <FormControlLabel value='Bald' control={<Radio />} label="None" />
          <FormControlLabel value='GrayShort1' control={<Radio />} label="Gray" />
          <FormControlLabel value='BrownShort2' control={<Radio />} label="Brown" />
          <FormControlLabel value='BuzzcutBlonde' control={<Radio />} label="Blonde" />
          <FormControlLabel value='GingerShort1' control={<Radio />} label="Red" />
          <FormControlLabel value='GingerLong2' control={<Radio />} label="Red 2" />
          <FormControlLabel value='BlackShort2' control={<Radio />} label="Black" />
          <FormControlLabel value='PinkShort1' control={<Radio />} label="Pink" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Hair Length</FormLabel>
        <RadioGroup aria-label="hair length" name="hair length" value={hairLength} onChange={(_, val) => {
          // @ts-ignore
          setHairLength(val);
          }}>
          <FormControlLabel value='short' control={<Radio />} label="Short" />
          <FormControlLabel value='long' control={<Radio />} label="Long" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Mouth</FormLabel>
        <RadioGroup aria-label="mouth" name="skintone" value={mouth} onChange={(_, val) => setMouth(val)}>
          <FormControlLabel value='./assets_two/mouths/NormalMouthLipstick.png' control={<Radio />} label="Red/Bored" />
          <FormControlLabel value='./assets_two/mouths/NormalMouth.png' control={<Radio />} label="Black/Bored" />
          <FormControlLabel value='./assets_two/mouths/SmirkMouthLipstick.png' control={<Radio />} label="Red/Smirk" />
          <FormControlLabel value='./assets_two/mouths/SmirkMouth.png' control={<Radio />} label="Black/Smirk" />
          <FormControlLabel value='./assets_two/mouths/BoredMouthLipstick.png' control={<Radio />} label="Red/Mad" />
          <FormControlLabel value='./assets_two/mouths/BoredMouth.png' control={<Radio />} label="Black/Mad" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Jewelry</FormLabel>
        <RadioGroup aria-label="jewelry" name="jewelry" value={jewelry} onChange={(_, val) => setJewelry(val)}>
          <FormControlLabel value='./assets_two/jewelry/none.png' control={<Radio />} label="None" />
          <FormControlLabel value='./assets_two/jewelry/DiamondStud.png' control={<Radio />} label="Diamond Stud" />
          <FormControlLabel value='./assets_two/jewelry/GoldStud.png' control={<Radio />} label="Gold Stud" />
          <FormControlLabel value='./assets_two/jewelry/GoldChain.png' control={<Radio />} label="Gold Chain" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Eyewear</FormLabel>
        <RadioGroup aria-label="eyewear" name="eyewear" value={eyewear} onChange={(_, val) => setEyewear(val)}>
          <FormControlLabel value='./assets_two/hair/short/Bald.png' control={<Radio />} label="None" />
          <FormControlLabel value='./assets_two/glasses/PurpleSuperheroMask.png' control={<Radio />} label="Hamburglar" />
          <FormControlLabel value='./assets_two/glasses/BanditMask.png' control={<Radio />} label="Lone Ranger" />
          <FormControlLabel value='./assets_two/glasses/RedSuperheroMask.png' control={<Radio />} label="Superhero" />
          <FormControlLabel value='./assets_two/glasses/Web3.png' control={<Radio />} label="Web3" />
          <FormControlLabel value='./assets_two/glasses/PurpleRain.png' control={<Radio />} label="Purple Rain" />
          <FormControlLabel value='./assets_two/glasses/TwinPop.png' control={<Radio />} label="Twin Pop" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Headband</FormLabel>
        <RadioGroup aria-label="headband" name="headband" value={sweatband} onChange={(_, val) => {
          // @ts-ignore
          setSweatband(val)
        }}>
          <FormControlLabel value='none' control={<Radio />} label="None" />
          <FormControlLabel value='Red' control={<Radio />} label="Red" />
          <FormControlLabel value='Blue' control={<Radio />} label="Blue" />
          <FormControlLabel value='Green' control={<Radio />} label="Green" />
        </RadioGroup>
      </FormControl>
      <FormControl component="fieldset" style={{margin: '4px'}}>
        <FormLabel component="legend">Accessories</FormLabel>
        <RadioGroup aria-label="jewelry" name="jewelry" value={accessory} onChange={(_, val) => setAccessory(val)}>
          <FormControlLabel value='./assets_two/hair/short/Bald.png' control={<Radio />} label="None" />
          <FormControlLabel value='./assets_two/accessories/MedicalMask.png' control={<Radio />} label="COVID Mask" />
          <FormControlLabel value='./assets_two/accessories/Pipe.png' control={<Radio />} label="Pipe" />
          <FormControlLabel value='./assets_two/accessories/Cigarette.png' control={<Radio />} label="Cigarette" />
          <FormControlLabel value='./assets_two/accessories/Cigarette2.png' control={<Radio />} label="Cigarette Alt" />
        </RadioGroup>
      </FormControl>
      </div>
    </div>
  );
}

export default App;
