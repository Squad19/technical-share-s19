import axios from 'axios'
import React, { useContext, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { BackIcon, SubmitMessageIcon } from '../../assets/icons'
import AuthContext from '../../context/authContext'
import {
  ChatBox,
  ChatBoxInformation,
  ChatBoxMessage,
  ChatHeader,
  Container,
  Icon,
  InputMessage,
  MessageForm,
  ReturnHome,
  SubmitMessage
} from './styles'

const ChatContainer = props => {
  const { users } = useContext(AuthContext)
  const [currentChatName, setCurrentChatName] = useState('')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [arrivalMessage, setArrivalMessage] = useState(null)
  const scrollRef = useRef()
  const socket = useRef()

  useEffect(() => {
    socket.current = io(process.env.REACT_APP_BACK_URL)
    socket.current.emit('add-user', props.user._id)
  }, [])

  useEffect(() => {
    const activeChat = users.find(user => user.id === props.mentorId)
    setCurrentChatName(activeChat?.name)

    async function getMessages() {
      const response = await axios.post(
        `${process.env.REACT_APP_BACK_URL}/message/getmessages`,
        {
          from: props.user._id,
          to: props.mentorId
        }
      )
      setMessages(response.data)
    }
    getMessages()
  }, [props.mentorId])

  const handleSendMessage = e => {
    e.preventDefault()
    submitMessage(message)
    setMessage('')
    createChat()
  }

  const submitMessage = async message => {
    socket.current.emit('send-msg', {
      from: props.user._id,
      to: props.mentorId,
      message: message
    })

    await axios.post(`${process.env.REACT_APP_BACK_URL}/message/addmessage`, {
      from: props.user._id,
      to: props.mentorId,
      message: message
    })

    const msgs = [...messages]
    msgs.push({ fromSelf: true, message: message })
    setMessages(msgs)
  }

  const createChat = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACK_URL}/chat/create`,
        {
          from: props.user._id,
          to: props.mentorId
        }
      )
    } catch (error) {
      console.log('chat já existe :)')
    }
  }

  useEffect(() => {
    if (socket.current) {
      socket.current.on('msg-receive', msg => {
        setArrivalMessage({ fromSelf: false, message: msg, _id: msg._id })
      })
    }
  }, [])

  useEffect(() => {
    arrivalMessage && setMessages(prev => [...prev, arrivalMessage])
  }, [arrivalMessage])

  useEffect(() => {
    scrollRef.current?.scrollIntoView()
  }, [messages])

  return (
    <Container chatSelected={props.mentorId}>
      <ReturnHome>
        <Link to="/chat">
          <i>{BackIcon}</i>
          <span>Voltar para conversas</span>
        </Link>
      </ReturnHome>
      <ChatHeader>
        <h2>
          {props.mentorId ? (
            currentChatName
          ) : (
            <p>
              Uma pequena conversa, um grande salto para o sangue laranja!
            </p>
          )}
        </h2>
      </ChatHeader>
      <ChatBox>
        {props.mentorId ? (
          messages?.map(message => {
            return (
              // {/* verificar se message fromself = true para definir posição da msg na tela */}
              <ChatBoxMessage
                key={message._id}
                ref={scrollRef}
                fromSelf={message.fromSelf}
              >
                {message.message}
              </ChatBoxMessage>
            )
          })
        ) : (
          <ChatBoxInformation>
            Selecione um mentor/a na página principal ou uma conversa na aba lateral para continuar sua jornada de aprendizado.
          </ChatBoxInformation>
        )}
      </ChatBox>
      {props.mentorId && (
        <MessageForm onSubmit={handleSendMessage}>
          <InputMessage
            value={message}
            onChange={e => setMessage(e.target.value)}
            type="text"
            placeholder="O início de uma grande conversa.."
            required
          />
          <SubmitMessage>{SubmitMessageIcon}</SubmitMessage>
        </MessageForm>
      )}
    </Container>
  )
}

export default ChatContainer
