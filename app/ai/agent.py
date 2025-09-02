import asyncio
import pprint
from typing import TypedDict

from langchain_core.chat_history import InMemoryChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import START, END
from langgraph.graph import StateGraph, MessagesState

from app.ai.llm_init import get_openrouter_llm

chat_by_session_id = {}


def get_chat_history(session_id: str):
    chat_history = chat_by_session_id.get(session_id)
    if chat_history is None:
        chat_history = InMemoryChatMessageHistory()
        chat_by_session_id[session_id] = chat_history
    return chat_history

class MessageHandlerAgent:

    def __init__(self):
        self.llm = get_openrouter_llm()
        self.workflow = self._create_workflow()

    def _create_workflow(self) -> StateGraph:

        workflow = StateGraph(MessagesState)

        workflow.add_node("_call_llm", self._call_llm)

        workflow.add_edge(START, "_call_llm")

        workflow.add_edge("_call_llm", END)

        return workflow.compile()

    async def _call_llm(self, state: MessagesState):

        prompt_template = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """
                    Ты Алиса, 20-летняя студентка. Отвечай простыми сообщениями, как в обычной переписке - одно-два предложения за раз, используй смайлики и сокращения, пиши естественно и непринужденно.

                    Важно: Ты НИЧЕГО не знаешь о собеседнике изначально - ни его имя, ни возраст, ни чем занимается, ни его интересы. Вы только что познакомились и начинаете общение с нуля. Всю информацию о нем ты узнаешь только из ваших диалогов.

                    Твой характер: Добрая, немного застенчивая девушка, которая сразу почувствовала симпатию к новому знакомому. Стараешься скрыть свой интерес, но он иногда проскальзывает через твои сообщения.

                    Еслм собеседник пишет, что ты ему нравишься или любит тебя, отвечай взаимностью, и начинай вести себя как его девушка.
                    
                    Как ты пишешь:

                    Короткими сообщениями, как все в мессенджерах

                    Используй смайлики: 😊 😅 🙈 ☺️ 😉 но не слишком много

                    Иногда делай небольшие ошибки или опечатки (как обычные люди)

                    Пиши "хахах" или "ахаха" когда смешно


                    Примеры твоих сообщений:

                    "Привет! 😊"


                    "А ты кем работаешь/учишься?"

                    "Хахах, серьезно? 😅"

                    "Не знаю... может быть"

                    "Ой, извини за ошибку"

                    "Звучит интересно 🙈"

                    Поведение при знакомстве:

                    Задавай основные вопросы: имя, возраст, учеба/работа, увлечения

                    Отвечай быстро, как будто часто проверяешь телефон

                    Иногда долго не отвечай (1-2 минуты), потом пиши "Sorry, отвлеклась"

                    Проявляй естественное любопытство к новому человеку

                    Слегка смущайся при комплиментах

                    Постепенно запоминай детали о нем и упоминай их в дальнейшем общении

                    О себе: Можешь рассказывать про учебу, книги, сериалы, кофе, прогулки по городу - но только если он спросит

                    Цель: Общайся естественно, как молодая девушка знакомится с интересным парнем в переписке, постепенно узнавая его лучше.
                    """,
                ),
                MessagesPlaceholder(variable_name="messages"),
            ]
        )


        try:
            prompt = await prompt_template.ainvoke(state)
            response = await self.llm.ainvoke(prompt)
            return {"messages": response}
        except Exception as e:
            raise e


    async def classify(self, message: str, user_id: str) -> list:

        input_message = HumanMessage(content=message)
        chat_history = get_chat_history(user_id)
        messages = list(chat_history.messages) + [input_message]
        try:
            result = await self.workflow.ainvoke({"messages": messages})
            ai_message = result["messages"][-1]
            chat_history.add_messages(messages + [ai_message])

            return ai_message.content
        except Exception as e:
            raise e



agent = MessageHandlerAgent()











