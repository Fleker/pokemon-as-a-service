export const verifyUserEmail = (email?: string) => {
  return email && email.includes('@gmail.com')
}

export const obtainUsernameFromEmail = (email?: string) => {
  if (!email) throw new Error('Cannot parse undefined email')
  return email.substring(0, email.indexOf('@gmail.com'))
}

export const aboutInfo = {
  bugs: {
    url: 'https://github.com/Fleker/pokemon-as-a-service/issues',
    label: 'GitHub Issues'
  },
  contact: {
    email: 'handnf+pokemon@gmail.com',
    label: 'Engineer Nick',
    chatmisc: '',
    chatraid: '',
  },
  guide: {
    url: 'https://github.com/Fleker/pokemon-as-a-service/'
  },
  mailing: {
    url: ''
  },
  templates: {
    location: 'https://github.com/Fleker/pokemon-as-a-service/issues',
    variants: 'https://github.com/Fleker/pokemon-as-a-service/issues',
    moves: 'https://github.com/Fleker/pokemon-as-a-service/issues',
    achievements: 'https://github.com/Fleker/pokemon-as-a-service/issues',
    events: 'https://github.com/Fleker/pokemon-as-a-service/issues',
  },
}
