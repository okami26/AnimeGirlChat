from langchain_core.chat_history import BaseChatMessageHistory
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import START, END
from langgraph.graph import StateGraph, MessagesState
from langchain_redis import RedisChatMessageHistory
from langchain_community.chat_message_histories import SQLChatMessageHistory

from app.ai.llm_init import get_openrouter_llm
from app.db.db import async_engine
from app.redis_db.redis_client import redis_client
from app.ai.prompts.templates import prompt_template_alice, prompt_template_nora

def get_redis_history(session_id: str, time_history: int) -> BaseChatMessageHistory:
    return RedisChatMessageHistory(session_id, redis_client=redis_client, ttl=time_history)

def get_sql_history(session_id: str) -> BaseChatMessageHistory:
    return SQLChatMessageHistory(
        session_id=session_id, connection=async_engine,
    )

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

        prompt_template = prompt_template_nora


        try:
            prompt = await prompt_template.ainvoke(state)
            response = await self.llm.ainvoke(prompt)
            return {"messages": response}
        except Exception as e:
            raise e


    async def classify(self, message: str, user_id: str) -> list:

        input_message = HumanMessage(content=message)
        chat_history = get_redis_history(user_id, 3600)
        messages = list(chat_history.messages) + [input_message]
        chat_history.add_user_message(input_message)
        try:
            result = await self.workflow.ainvoke({"messages": messages})
            ai_message = result["messages"][-1]
            chat_history.add_ai_message(ai_message)
            return ai_message.content
        except Exception as e:
            raise e



agent = MessageHandlerAgent()








