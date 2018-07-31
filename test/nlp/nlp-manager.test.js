/*
 * Copyright (c) AXA Shared Services Spain S.A.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const { NlpManager } = require('../../lib');

describe('NLP Manager', () => {
  describe('constructor', () => {
    test('Should create a new instance', () => {
      const manager = new NlpManager();
      expect(manager).toBeDefined();
    });
    test('Should initialize the default properties', () => {
      const manager = new NlpManager();
      expect(manager.nerManager).toBeDefined();
      expect(manager.guesser).toBeDefined();
      expect(manager.sentiment).toBeDefined();
      expect(manager.languages).toEqual([]);
      expect(manager.classifiers).toEqual({});
      expect(manager.intentEntities).toEqual({});
    });
  });

  describe('Add language', () => {
    test('Should add the language and the classifier', () => {
      const manager = new NlpManager();
      manager.addLanguage('en');
      expect(manager.languages).toHaveLength(1);
      expect(manager.languages).toContain('en');
      expect(manager.classifiers.en).toBeDefined();
    });
    test('Should add several languages', () => {
      const manager = new NlpManager();
      manager.addLanguage(['en', 'es']);
      expect(manager.languages).toHaveLength(2);
      expect(manager.languages).toContain('en');
      expect(manager.languages).toContain('es');
      expect(manager.classifiers.en).toBeDefined();
      expect(manager.classifiers.es).toBeDefined();
    });
    test('Should not add already existing lenguages', () => {
      const manager = new NlpManager();
      manager.addLanguage(['en', 'es']);
      manager.addLanguage(['en', 'en', 'es', 'fr']);
      expect(manager.languages).toHaveLength(3);
      expect(manager.languages).toContain('en');
      expect(manager.languages).toContain('es');
      expect(manager.languages).toContain('fr');
      expect(manager.classifiers.en).toBeDefined();
      expect(manager.classifiers.es).toBeDefined();
      expect(manager.classifiers.fr).toBeDefined();
    });
  });

  describe('Guess language', () => {
    test('Should guess the language of an utterance', () => {
      const manager = new NlpManager();
      manager.addLanguage(['en', 'es']);
      let language = manager.guessLanguage('what is?');
      expect(language).toEqual('en');
      language = manager.guessLanguage('¿Qué es?');
      expect(language).toEqual('es');
    });
  });

  describe('Add document', () => {
    test('If locale is not defined, then guess it', () => {
      const manager = new NlpManager();
      manager.addLanguage(['en', 'es']);
      manager.addDocument(undefined, 'Dónde están las llaves', 'keys');
      expect(manager.classifiers.es.docs).toHaveLength(1);
      expect(manager.classifiers.en.docs).toHaveLength(0);
    });
    test('Should check that there is a classifier for the locale', () => {
      const manager = new NlpManager();
      manager.addLanguage(['en']);
      expect(() => manager.addDocument('es', 'Dónde están las llaves', 'keys')).toThrowError('Classifier not found for locale es');
    });
    test('Should add the document to the classifier', () => {
      const manager = new NlpManager();
      manager.addLanguage(['en', 'es']);
      manager.addDocument('es', 'Dónde están las llaves', 'keys');
      expect(manager.classifiers.es.docs).toHaveLength(1);
    });
    test('Should extract managed named entities', () => {
      const manager = new NlpManager();
      manager.addLanguage(['en', 'es']);
      manager.addNamedEntityText('hero', 'spiderman', ['en'], ['Spiderman', 'Spider-man']);
      manager.addNamedEntityText('hero', 'iron man', ['en'], ['iron man', 'iron-man']);
      manager.addNamedEntityText('hero', 'thor', ['en'], ['Thor']);
      manager.addNamedEntityText('food', 'burguer', ['en'], ['Burguer', 'Hamburguer']);
      manager.addNamedEntityText('food', 'pizza', ['en'], ['pizza']);
      manager.addNamedEntityText('food', 'pasta', ['en'], ['Pasta', 'spaghetti']);
      manager.addDocument('en', 'I saw %hero%', 'sawhero');
      expect(manager.intentEntities.sawhero).toBeDefined();
      expect(manager.intentEntities.sawhero).toContain('hero');
    });
  });

  describe('Remove document', () => {
    test('If locale is not defined must be guessed', () => {
      const manager = new NlpManager();
      manager.addLanguage(['en', 'es']);
      manager.addDocument('es', 'Dónde están las llaves', 'keys');
      manager.removeDocument(undefined, 'Dónde están las llaves', 'keys');
      expect(manager.classifiers.es.docs).toHaveLength(0);
    });
    test('Should check that there is a classifier for the locale', () => {
      const manager = new NlpManager();
      manager.addLanguage(['en']);
      expect(() => manager.removeDocument('es', 'Dónde están las llaves', 'keys')).toThrowError('Classifier not found for locale es');
    });
    test('Should remove the document from the classifier', () => {
      const manager = new NlpManager();
      manager.addLanguage(['en', 'es']);
      manager.addDocument('es', 'Dónde están las llaves', 'keys');
      manager.removeDocument('es', 'Dónde están las llaves', 'keys');
      expect(manager.classifiers.es.docs).toHaveLength(0);
    });
  });

  describe('Classify', () => {
    test('Should classify an utterance', () => {
      const manager = new NlpManager();
      manager.addLanguage(['fr', 'jp']);
      manager.addDocument('fr', 'Bonjour', 'greet');
      manager.addDocument('fr', 'bonne nuit', 'greet');
      manager.addDocument('fr', 'Bonsoir', 'greet');
      manager.addDocument('fr', 'J\'ai perdu mes clés', 'keys');
      manager.addDocument('fr', 'Je ne trouve pas mes clés', 'keys');
      manager.addDocument('fr', 'Je ne me souviens pas où sont mes clés', 'keys');
      manager.train();
      const result = manager.classify('fr', 'où sont mes clés');
      expect(result).toHaveLength(2);
      expect(result[0].label).toEqual('keys');
      expect(result[0].value).toBeGreaterThan(0.8);
    });
    test('Should guess language if not provided', () => {
      const manager = new NlpManager();
      manager.addLanguage(['fr', 'ja']);
      manager.addDocument('fr', 'Bonjour', 'greet');
      manager.addDocument('fr', 'bonne nuit', 'greet');
      manager.addDocument('fr', 'Bonsoir', 'greet');
      manager.addDocument('fr', 'J\'ai perdu mes clés', 'keys');
      manager.addDocument('fr', 'Je ne trouve pas mes clés', 'keys');
      manager.addDocument('fr', 'Je ne me souviens pas où sont mes clés', 'keys');
      manager.addDocument('ja', 'おはようございます', 'greet');
      manager.addDocument('ja', 'こんにちは', 'greet');
      manager.addDocument('ja', 'おやすみ', 'greet');
      manager.addDocument('ja', '私は私の鍵を紛失した', 'keys');
      manager.addDocument('ja', '私は私の鍵がどこにあるのか覚えていない', 'keys');
      manager.addDocument('ja', '私は私の鍵が見つからない', 'keys');
      manager.train();
      let result = manager.classify('où sont mes clés');
      expect(result).toHaveLength(2);
      expect(result[0].label).toEqual('keys');
      expect(result[0].value).toBeGreaterThan(0.8);
      result = manager.classify('私の鍵はどこにありますか');
      expect(result).toHaveLength(2);
      expect(result[0].label).toEqual('keys');
      expect(result[0].value).toBeGreaterThan(0.8);
    });
  });

  describe('Is equal classification', () => {
    test('Should return true if all classifications have 0.5 score', () => {
      const manager = new NlpManager();
      const classifications = [];
      classifications.push({ label: 'a', value: 0.5 });
      classifications.push({ label: 'b', value: 0.5 });
      classifications.push({ label: 'c', value: 0.5 });
      classifications.push({ label: 'd', value: 0.5 });
      classifications.push({ label: 'e', value: 0.5 });
      classifications.push({ label: 'f', value: 0.5 });
      const result = manager.isEqualClassification(classifications);
      expect(result).toBeTruthy();
    });
    test('Should return false if at least one classification score is not 0.5', () => {
      const manager = new NlpManager();
      const classifications = [];
      classifications.push({ label: 'a', value: 0.5 });
      classifications.push({ label: 'b', value: 0.5 });
      classifications.push({ label: 'c', value: 0.6 });
      classifications.push({ label: 'd', value: 0.5 });
      classifications.push({ label: 'e', value: 0.5 });
      classifications.push({ label: 'f', value: 0.5 });
      const result = manager.isEqualClassification(classifications);
      expect(result).toBeFalsy();
    });
  });

  describe('Process', () => {
    test('Should classify an utterance', () => {
      const manager = new NlpManager();
      manager.addLanguage(['fr', 'ja']);
      manager.addDocument('fr', 'Bonjour', 'greet');
      manager.addDocument('fr', 'bonne nuit', 'greet');
      manager.addDocument('fr', 'Bonsoir', 'greet');
      manager.addDocument('fr', 'J\'ai perdu mes clés', 'keys');
      manager.addDocument('fr', 'Je ne trouve pas mes clés', 'keys');
      manager.addDocument('fr', 'Je ne me souviens pas où sont mes clés', 'keys');
      manager.train();
      const result = manager.process('où sont mes clés');
      expect(result).toBeDefined();
      expect(result.locale).toEqual('fr');
      expect(result.localeIso2).toEqual('fr');
      expect(result.utterance).toEqual('où sont mes clés');
      expect(result.classification).toBeDefined();
      expect(result.classification).toHaveLength(2);
      expect(result.intent).toEqual('keys');
      expect(result.score).toBeGreaterThan(0.95);
    });
    test('Language can be specified', () => {
      const manager = new NlpManager();
      manager.addLanguage(['fr', 'ja']);
      manager.addDocument('fr', 'Bonjour', 'greet');
      manager.addDocument('fr', 'bonne nuit', 'greet');
      manager.addDocument('fr', 'Bonsoir', 'greet');
      manager.addDocument('fr', 'J\'ai perdu mes clés', 'keys');
      manager.addDocument('fr', 'Je ne trouve pas mes clés', 'keys');
      manager.addDocument('fr', 'Je ne me souviens pas où sont mes clés', 'keys');
      manager.train();
      const result = manager.process('fr', 'où sont mes clés');
      expect(result).toBeDefined();
      expect(result.locale).toEqual('fr');
      expect(result.localeIso2).toEqual('fr');
      expect(result.utterance).toEqual('où sont mes clés');
      expect(result.classification).toBeDefined();
      expect(result.classification).toHaveLength(2);
      expect(result.intent).toEqual('keys');
      expect(result.score).toBeGreaterThan(0.95);
    });
    test('Should search for entities', () => {
      const manager = new NlpManager();
      manager.addLanguage(['en']);
      manager.addNamedEntityText('hero', 'spiderman', ['en'], ['Spiderman', 'Spider-man']);
      manager.addNamedEntityText('hero', 'iron man', ['en'], ['iron man', 'iron-man']);
      manager.addNamedEntityText('hero', 'thor', ['en'], ['Thor']);
      manager.addNamedEntityText('food', 'burguer', ['en'], ['Burguer', 'Hamburguer']);
      manager.addNamedEntityText('food', 'pizza', ['en'], ['pizza']);
      manager.addNamedEntityText('food', 'pasta', ['en'], ['Pasta', 'spaghetti']);
      manager.addDocument('en', 'I saw %hero% eating %food%', 'sawhero');
      manager.addDocument('en', 'I have seen %hero%, he was eating %food%', 'sawhero');
      manager.addDocument('en', 'I want to eat %food%', 'wanteat');
      manager.train();
      const result = manager.process('I saw spiderman eating spaghetti today in the city!');
      expect(result.intent).toEqual('sawhero');
      expect(result.score).toBeGreaterThan(0.85);
      expect(result.entities).toHaveLength(2);
      expect(result.entities[0].sourceText).toEqual('Spiderman');
      expect(result.entities[1].sourceText).toEqual('spaghetti');
    });
    test('Should search for entities if the language is specified', () => {
      const manager = new NlpManager();
      manager.addLanguage(['en']);
      manager.addNamedEntityText('hero', 'spiderman', ['en'], ['Spiderman', 'Spider-man']);
      manager.addNamedEntityText('hero', 'iron man', ['en'], ['iron man', 'iron-man']);
      manager.addNamedEntityText('hero', 'thor', ['en'], ['Thor']);
      manager.addNamedEntityText('food', 'burguer', ['en'], ['Burguer', 'Hamburguer']);
      manager.addNamedEntityText('food', 'pizza', ['en'], ['pizza']);
      manager.addNamedEntityText('food', 'pasta', ['en'], ['Pasta', 'spaghetti']);
      manager.addDocument('en', 'I saw %hero% eating %food%', 'sawhero');
      manager.addDocument('en', 'I have seen %hero%, he was eating %food%', 'sawhero');
      manager.addDocument('en', 'I want to eat %food%', 'wanteat');
      manager.train();
      const result = manager.process('en', 'I saw spiderman eating spaghetti today in the city!');
      expect(result.intent).toEqual('sawhero');
      expect(result.score).toBeGreaterThan(0.85);
      expect(result.entities).toHaveLength(2);
      expect(result.entities[0].sourceText).toEqual('Spiderman');
      expect(result.entities[1].sourceText).toEqual('spaghetti');
    });
    test('Should give the sentiment even if NLP not trained', () => {
      const manager = new NlpManager();
      manager.addLanguage(['en']);
      const result = manager.process('I love cats');
      expect(result.sentiment).toBeDefined();
      expect(result.sentiment.vote).toEqual('positive');
    });
    test('Should return None with score 1 if the utterance cannot be classified', () => {
      const manager = new NlpManager();
      manager.addLanguage(['en']);
      manager.addDocument('en', 'Hello', 'greet');
      manager.addDocument('en', 'Good morning', 'greet');
      manager.addDocument('en', 'Good evening', 'greet');
      manager.addDocument('en', 'Where are my keys?', 'keys');
      manager.addDocument('en', 'I don\'t know where my keys are', 'keys');
      manager.addDocument('en', 'I\'ve lost my keys', 'keys');
      manager.train();
      const result = manager.process('This should return none');
      expect(result.intent).toEqual('None');
      expect(result.score).toEqual(1);
    });
    test('If the NLG is trained, then return the answer', () => {
      const manager = new NlpManager({ languages: ['en'] });
      manager.addDocument('en', 'goodbye for now', 'greetings.bye');
      manager.addDocument('en', 'bye bye take care', 'greetings.bye');
      manager.addDocument('en', 'okay see you later', 'greetings.bye');
      manager.addDocument('en', 'bye for now', 'greetings.bye');
      manager.addDocument('en', 'i must go', 'greetings.bye');
      manager.addDocument('en', 'hello', 'greetings.hello');
      manager.addDocument('en', 'hi', 'greetings.hello');
      manager.addDocument('en', 'howdy', 'greetings.hello');
      manager.addDocument('en', 'how is your day', 'greetings.howareyou');
      manager.addDocument('en', 'how is your day going', 'greetings.howareyou');
      manager.addDocument('en', 'how are you', 'greetings.howareyou');
      manager.addDocument('en', 'how are you doing', 'greetings.howareyou');
      manager.addDocument('en', 'what about your day', 'greetings.howareyou');
      manager.addDocument('en', 'are you alright', 'greetings.howareyou');
      manager.addDocument('en', 'nice to meet you', 'greetings.nicetomeetyou');
      manager.addDocument('en', 'pleased to meet you', 'greetings.nicetomeetyou');
      manager.addDocument('en', 'it was very nice to meet you', 'greetings.nicetomeetyou');
      manager.addDocument('en', 'glad to meet you', 'greetings.nicetomeetyou');
      manager.addDocument('en', 'nice meeting you', 'greetings.nicetomeetyou');
      manager.addDocument('en', 'nice to see you', 'greetings.nicetoseeyou');
      manager.addDocument('en', 'good to see you', 'greetings.nicetoseeyou');
      manager.addDocument('en', 'great to see you', 'greetings.nicetoseeyou');
      manager.addDocument('en', 'lovely to see you', 'greetings.nicetoseeyou');
      manager.addDocument('en', 'nice to talk to you', 'greetings.nicetotalktoyou');
      manager.addDocument('en', 'it\'s nice to talk to you', 'greetings.nicetotalktoyou');
      manager.addDocument('en', 'nice talking to you', 'greetings.nicetotalktoyou');
      manager.addDocument('en', 'it\'s been nice talking to you', 'greetings.nicetotalktoyou');
      manager.addAnswer('en', 'greetings.bye', 'Till next time');
      manager.addAnswer('en', 'greetings.bye', 'See you soon!');
      manager.addAnswer('en', 'greetings.hello', 'Hey there!');
      manager.addAnswer('en', 'greetings.hello', 'Greetings!');
      manager.addAnswer('en', 'greetings.howareyou', 'Feeling wonderful!');
      manager.addAnswer('en', 'greetings.howareyou', 'Wonderful! Thanks for asking');
      manager.addAnswer('en', 'greetings.nicetomeetyou', 'It\'s nice meeting you, too');
      manager.addAnswer('en', 'greetings.nicetomeetyou', 'Likewise. I\'m looking forward to helping you out');
      manager.addAnswer('en', 'greetings.nicetomeetyou', 'Nice meeting you, as well');
      manager.addAnswer('en', 'greetings.nicetomeetyou', 'The pleasure is mine');
      manager.addAnswer('en', 'greetings.nicetoseeyou', 'Same here. I was starting to miss you');
      manager.addAnswer('en', 'greetings.nicetoseeyou', 'So glad we meet again');
      manager.addAnswer('en', 'greetings.nicetotalktoyou', 'It sure was. We can chat again anytime');
      manager.addAnswer('en', 'greetings.nicetotalktoyou', 'I enjoy talking to you, too');
      manager.train();
      let result = manager.process('goodbye');
      expect(result.answer).toMatch(new RegExp(/(Till next time)|(See you soon!)/g));
      result = manager.process('It was nice to meet you');
      expect(result.answer).toMatch(new RegExp(/(It's nice meeting you, too)|(Likewise. I'm looking forward to helping you out)|(Nice meeting you, as well)|(The pleasure is mine)/g));
    });
  });

  describe('Save and load', () => {
    test('Should allow to save, load and all should be working', () => {
      let manager = new NlpManager();
      manager.addLanguage(['en']);
      manager.addNamedEntityText('hero', 'spiderman', ['en'], ['Spiderman', 'Spider-man']);
      manager.addNamedEntityText('hero', 'iron man', ['en'], ['iron man', 'iron-man']);
      manager.addNamedEntityText('hero', 'thor', ['en'], ['Thor']);
      manager.addNamedEntityText('food', 'burguer', ['en'], ['Burguer', 'Hamburguer']);
      manager.addNamedEntityText('food', 'pizza', ['en'], ['pizza']);
      manager.addNamedEntityText('food', 'pasta', ['en'], ['Pasta', 'spaghetti']);
      manager.addDocument('en', 'I saw %hero% eating %food%', 'sawhero');
      manager.addDocument('en', 'I have seen %hero%, he was eating %food%', 'sawhero');
      manager.addDocument('en', 'I want to eat %food%', 'wanteat');
      manager.train();
      manager.save();
      manager = new NlpManager();
      manager.load();
      const result = manager.process('I saw spiderman eating spaghetti today in the city!');
      expect(result.intent).toEqual('sawhero');
      expect(result.score).toBeGreaterThan(0.85);
      expect(result.entities).toHaveLength(2);
      expect(result.entities[0].sourceText).toEqual('Spiderman');
      expect(result.entities[1].sourceText).toEqual('spaghetti');
    });
  });
});
