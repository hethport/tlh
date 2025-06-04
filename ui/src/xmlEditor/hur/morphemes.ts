

type Seq = string | string[];

export const hurrianMorphemes: { [key: string]: { [key: string]: { [key: string]: Seq } } } = {
  'noun': {
    'rlt': {
      'na': 'RELAT.PL',
      'la': 'RELAT.PL',
      'ra': 'RELAT.PL',
      'n': 'RELAT.PL',
      'l': 'RELAT.PL',
      'r': 'RELAT.PL',
      'ne': 'RELAT.SG',
      'le': 'RELAT.SG',
      're': 'RELAT.SG',
      'ni': 'RELAT.SG',
      'li': 'RELAT.SG',
      'ri': 'RELAT.SG'
    },
    'poss': {
      'iff': '1',
      'iffe': '1',
      'v': '2',
      'i': '3'
    },
    'num': {
      'aš': 'PL',
      'āš': 'PL',
      'až': 'PL',
      'āž': 'PL'
    },
    'cas': {
      '': '.ABS',
      'ž': 'ERG',
      've': 'GEN',
      'va': 'DAT',
      'we': 'GEN',
      'wa': 'DAT',
      'ta': 'DIR',
      'da': 'DIR',
      'tan': 'ABL',
      'dan': 'ABL',
      'ra': 'COM',
      'a': ['ESS', 'DAT'],
      'ae': 'INS',
      'ai': 'INS',
      'uš': 'EQU1',
      'nna': 'EQU2',
      'nni': 'ASSOC',
      'ne': 'ABL/INS',
      'e': ['DIR/LOC', 'GEN']
    },
    'them': {
      'u': 'EPNTH'
    }
  },
  'modal': {
    'valence': {
      'i': 'MOD.ACT',
      'e': 'MOD.ACT',
      'o': 'MOD.ACT'
    },
    'l': {
      'l': 'l'
    },
    'mood': {
      'anni': 'DESID',
      'ānni': 'DESID',
      'ai': 'PURP',
      'aī': 'PURP',
      'āi': 'PURP',
      'āī': 'PURP'
    }
  },
  'voice': {
    'res': {
      'ašt': 'RES',
      'ešt': 'RES',
      'ōšt': 'RES'
    },
    'voice': {
      'u': 'MED',
      'i': 'ANTIP',
      'ī': 'ANTIP',
      'a': 'INT'
    },
    'person': {
      'b': 'b'
    }
  },
  'aspect': {
    'res': {
      'ašt': 'RES',
      'ešt': 'RES',
      'ōšt': 'RES'
    },
    'aspect': {
      'u': 'TR.PFV',
      'o': 'TR.PFV',
      'ō': 'TR.PFV'
    },
    'person': {
      'm': '3A.SG'
    }
  },
  'enclitic': {
    'pron': {
      'tta': '1SG',
      'mma': '2SG',
      'nna': '3SG',
      'mē': '3SG',
      'tilla': '1PL',
      'dilla': '1PL',
      'till': '1PL',
      'dill': '1PL',
      'ppa': '2PL',
      'ffa': '2PL',
      'lla': '3PL',
      'lle': '3PL',
      't': '1SG',
      'm': '2SG',
      'n': '3SG',
      'til': '1PL',
      'dil': '1PL',
      'p': '2PL',
      'b': '2PL',
      'v': '2PL',
      'l': '3PL'
    },
    'part': {
      'an': 'CON',
      'ān': 'CON',
      'man': 'EMPH',
      'mān': 'CON',
      'ma': 'CON',
      'nin': 'PART',
      'nīn': 'PART'
    }
  }
};
