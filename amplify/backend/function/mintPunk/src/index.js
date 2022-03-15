const {ethers} = require('ethers');
const MerkleTreeProof = require('@authenticid-labs/merkle-tree-proof');
const { MerkleTree } = require('merkletreejs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { Canvas, Image } = require('canvas');
const mergeImages = require('merge-images');

const { Accessories, Backgrounds, Eyes, Hats } = require('./elements');

let glasses = 'none';
let accessory = 'none';
let hat = 'none';
let jewelry = 'none';
let hairColor = 'bald';
let hairLength = 'short';
let eyes = 'brown';
let skinTone = 'African';
let expression = 'Normal';
let facialHair = 'none';
let gender = 'Male';

const getRandomNumber = () => {
    const roll = Math.random();
    return roll;
}

const getRandomGender = () => {
  const roll = getRandomNumber();
  
  return roll > 0.5 ? 'Male' : 'Female';
}

const getHairColor = (hairLength, hairColor, hat) => {
    if (hat !== 'none') {
        if (hairLength === 'short') {
            return 'bald';
        } else {
            switch (hat) {
                case 'BaseballCapBlack':
                case 'BaseballCapGreen':
                case 'BaseballCapPurple':
                case 'BlackBeanie':
                case 'BlueBeanie':
                case 'RedBeanie':
                case 'SidewaysHatBlack':
                case 'SidewaysHatBlue':
                case 'SidewaysHatRed':
                    return `hat${hairColor}`;
                case 'HoodieBlack':
                case 'HoodieBlue':
                case 'HoodieGray':
                    return 'bald';
                default:
                    return hairColor;
            }
        }
    }
}

const getHat = (hairLength, hat) => {
    if (hairLength === 'long' && hat.includes('Sweatband')) {
        return `LongHair${hat}`;
    }
    return hat;
}

const getRandomAccessory = () => {

}

const getRandomBackground = () => {

}

const getRandomGlasses = () => {

}

const getRandomJewelry = () => {

}

const getRandomHat = () => {

}

const getRandomHairColor = (gender, geographicOrigin) => {
  let color;
  const roll = getRandomNumber();
  if (gender === 'Male') {
    switch (geographicOrigin) {
      case 'AFRICAN':
      case 'SOUTHASIAN':
      case 'EASTASIAN':
        if (roll < 0.8) 
          color = 'Black';
        else if (roll < 0.85) 
          color = 'Blonde';
        else if (roll < 0.87) 
          color = 'Pink';
        else if (roll < 0.9) 
          color = 'Bald'
        else 
          color = 'Gray';
        break;
      default:
        if (roll < 0.05)
          color = 'Pink';
        else if (roll < 0.3)
          color = 'Blonde';
        else if (roll < 0.4)
          color = 'Ginger';
        else if (roll < 0.5)
          color = 'Bald';
        else if (roll < 0.9)
          color = 'Brown';
        else
          color = 'Gray';
        break;

    }
    console.log(color);
  } else {
    switch (geographicOrigin) {
      case 'AFRICAN':
      case 'SOUTHASIAN':
      case 'EASTASIAN':
        if (roll < 0.8) 
          color = 'Black';
        else if (roll < 0.85) 
          color = 'Blonde';
        else if (roll < 0.87) 
          color = 'Pink';
        else 
          color = 'Gray';
        break;
      default:
        if (roll < 0.05)
          color = 'Pink';
        else if (roll < 0.3)
          color = 'Blonde';
        else if (roll < 0.4)
          color = 'Ginger';
        else if (roll < 0.9)
          color = 'Brown';
        else
          color = 'Gray';
        break;
    }
  }
}

const getRandomSkinTone = () => {
  const roll = getRandomNumber();
  if (roll < 0.24) return 'pink';
  if (roll < 0.25) return 'alien';
  if (roll < 0.49) return 'tan';
  if (roll < 0.5) return 'zombie';
  if (roll < 0.75) return 'asian';
  return 'brown';
}

const doMerge = async (attributes) => {
	try {
		const result = await mergeImages(
			[
				`./assets/backgrounds/${attributes.background}.png`, 
				'./assets/outline.png', 
				`./assets/skintones/${attributes.skinTone}.png`, 
				'./assets/nose.png', 
				`./assets/eyes/${attributes.eyes}.png`, 
				`./assets/hair/${attributes.hairLength}/${getHairColor(attributes.hairLength, attributes.hairColor, attributes.hat)}.png`,   
				`./assets/mouths/${attributes.expression}${attributes.gender === 'Female' ? 'Lipstick' : ''}.png`, 
				`./assets/facialhair/${attributes.facialHair}.png`, 
				`./assets/hats/${getHat(attributes.hairLength, attributes.hat)}.png`,
				`./assets/jewelry/${attributes.jewelry}.png`,
				`./assets/glasses/${attributes.glasses}.png`,
				`./assets/accessories/${attributes.accessory}.png`,
			],
			{
				Canvas: Canvas,
				Image: Image
			});
		const b64 = result.split(',')[1];
		// console.log(b64);
		const str = Buffer.from(b64, 'base64');
		return str;
	
	} catch(error) {
		console.log(error);
	}
}

const doProofs = async (address, proofs) => {
    try {
        const provider = new ethers.providers.AlchemyProvider('rinkeby', process.env.ALCHEMY_ID);

        console.log('Address: ', address);
        const root = await MerkleTreeProof.getMerkleTreeRoot(provider, address);
        if (root === '0x0') {
            // this really should not happen as a non-Real ID user cannot mint
            throw new Error('No Merkle Root');
        }
        const fixedProofs = proofs.map(p => {
            const {position, leaf, data} = p;
            return {position, leaf, data: Buffer.from(data)}
        });
        const proven = fixedProofs.every(({leaf, ...proof}) => MerkleTree.verify(proof, leaf, root));
        if (!!proven) {
            console.log('proofs proven')
            return true;
        } else {
            console.log('proofs not proven')
            return false;
        }
    } catch (error) {
        console.log(error);
        return error;
    }
}

const mintRandom = async (address, id) => {

}

const translateEmotion = (emotion, gender) => {
  let mouth;
  if (!emotion) {
    mouth = 'NormalMouth';
  }
  switch (emotion) {
    case 'ANGER':
    case 'DISGUST':
    case 'FEAR':
    case 'SADNESS':
      mouth = 'BoredMouth';
      break;
    case 'JOY':
      mouth = 'SmirkMouth';
      break;
    default:
      mouth = 'NormalMouth';
      break;
  }
  if (!!gender && gender === 'Female')
    mouth += 'Lipstick';
  
  return mouth;
}

const translateGeographicOrigin = (geo) => {
  if (!geo) {
    return getRandomSkinTone();
  }
  if (geo === 'AFRICAN') return 'brown';
  if (geo === 'EASTASIAN') return 'asian';
  if (geo === 'SOUTHASIAN') return 'tan';
  if (geo === 'EUROPEAN') return 'pink';
}

const getDeterministicAttributes = async (address, proofs) => {
    const result = await doProofs(address, proofs);
    if (result === true) {
        const emotion = proofs.find(e => e.key === 'Emotion')?.value;
        const geographicOrigin = proofs.find(e => e.key === 'GeographicOrigin')?.value;
        const gender = proofs.find(e => e.key === 'Sex')?.value;
        const eyeColor = proofs.find(e => e.key === 'EyeColor')?.value;
        const hairColor = proofs.find(e => e.key === 'HairColor')?.value;
        const facialHair = proofs.find(e => e.key === 'FacialHair')?.value;
        
        return {
            gender: !!gender && gender === 'M' ? 'Male' : 'Female',
            eyeColor: !!eyeColor ? eyeColor.toLowerCase() : 'alien',
            skinTone: translateGeographicOrigin(geographicOrigin),
            mouth: translateEmotion(emotion, gender),
            facialHair: facialHair > 20 ? 'Beard' : 'none',
            hairColor: !!hairColor ? hairColor.toLowerCase() : getRandomHairColor()
        }
    }
}

const getRandomAttributes = () => {
    return {
        background: getRandomBackground(),
        hat: getRandomHat(),
        glasses: getRandomGlasses(),
        accessory: getRandomAccessory(),
        jewelry: getRandomJewelry()
    }
}

const getAttributes = (address, proofs) => {

}

const main = async(args) => {
    const {address, proofs, id} = args;
    if (proofs.length === 0) {
        return mintRandom(address, id);
    }
    if (await doProofs(address, proofs))

    try {
        const s3Client = new S3Client({region: 'us-east-1'});
        const metadata = {
            "description": `Real ID CryptoPunk #${id}.`, 
            "external_url": `https://realidpunks.com/collection/${id}`, 
            "image": `https://real-id-punks.s3.amazonaws.com/realidpunks-v3/${id}.png`, 
            "attributes": getAttributes(address, proofs)
        }
        const nft = await doMerge(getAttributes(address, proofs));
        await s3Client.send(new PutObjectCommand({
            Bucket: 'real-id-punks',
            Key: `realidpunks-v3/${id}.json`,
            Body: JSON.stringify(metadata, null, 2)
        }));
        await s3Client.send(new PutObjectCommand({
            Bucket: 'real-id-punks',
            Key: `realidpunks-v3/${id}.png`,
            Body: nft
        }))
        return 'success';
    } catch (error) {
        console.log(error);
    }
    return {result: 'complete'};
}

exports.handler = async (event) => {
    let results = {}
    
    const args = JSON.parse(event.body);
    results = await main(args);

    const response = {
        statusCode: 200,
    //  Uncomment below to enable CORS requests
     headers: {
         "Access-Control-Allow-Origin": "*",
         "Access-Control-Allow-Headers": "*"
     }, 
        body: JSON.stringify(results),
    };
    return response;
};
