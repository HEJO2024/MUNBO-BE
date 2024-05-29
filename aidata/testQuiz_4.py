#!pip install -q langchain openai faiss-cpu langchainhub pypdf chromadb tiktoken

#from langchain.embeddings import OpenAIEmbeddings
#from langchain.vectorstores import FAISS
import csv
import re
import json
import os
from langchain.prompts import FewShotPromptTemplate, ChatPromptTemplate, FewShotChatMessagePromptTemplate
from langchain.chat_models import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain.callbacks import get_openai_callback
import sys

from dotenv import load_dotenv
load_dotenv()  # .env 파일 로드
api_key = os.getenv("GPT_API_KEY")

os.environ["OPENAI_API_KEY"] = api_key

input_file = './src/2022_1_for_test.csv'
output_format = {"input": "", "output": ""}
results = []

with open(input_file, 'r', encoding='utf-8') as file:
    reader = csv.reader(file)
    next(reader)
    for row in reader:
        question = row[1]
        choices = [row[2], row[3], row[4], row[5]]
        answer = row[6]
        keyword = row[8]
        output_data = f"{question}\n A){choices[0]}\n B){choices[1]}\n C){choices[2]}\n D){choices[3]} \n Answer){answer}"
        result = output_format.copy()
        result["input"] = keyword
        result["output"] = output_data
        results.append(result)

admin_prompt = """
"""

with open("./src/testQuiz_prompt.txt", "r", encoding='utf-8') as f:
    admin_prompt = f.read()
token_usage=0

examples = results
example_prompt = ChatPromptTemplate.from_messages([("human", "{input}"), ("ai", "{output}")])
few_shot_prompt = FewShotChatMessagePromptTemplate(example_prompt=example_prompt, examples=examples)
final_prompt = ChatPromptTemplate.from_messages([("system", admin_prompt), few_shot_prompt, ("human", "{input}")])

model = ChatOpenAI(model="gpt-4o", temperature=0, max_tokens=1024)
parser = StrOutputParser()
chain = final_prompt | model | parser

# 사용자 입력 값 읽기
userInput = sys.argv[1]
# user_input = json.loads(userInput)
text = userInput

with get_openai_callback() as cb:
    made_quiz = chain.invoke({"input": text})
    token_usage=cb.total_tokens
    #print(made_quiz)
    #print(f"Total cost: {cb.total_cost}")
    # print(f"Successful requests: {cb.successful_requests}")
    # print(f"Prompt tokens: {cb.prompt_tokens}")
    # print(f"Completion tokens: {cb.completion_tokens}")

def parse_questions(text):
    questions = []
    question_pattern = re.compile(r"(?:Q\d+: )?(.+?)\n+\s*A[.)]\s*(.+?)\n+\s*B[.)]\s*(.+?)\n+\s*C[.)]\s*(.+?)\n+\s*D[.)]\s*(.+?)\n+\s*Answer[):.]?\s*(.+?)\n+\s*Explanation[):.]?\s*(.+?)(?=\n+(?:Q\d+: )|$)", re.DOTALL)
    matches = question_pattern.findall(text)
    for match in matches:
        question = {
            "question": match[0],
            "options": [match[1], match[2], match[3], match[4]],
            "answer": match[5],
            "explanation": match[6],
            "key": keyword
        }
        questions.append(question)
    return questions

quizData = parse_questions(made_quiz)
print(quizData)
print(token_usage)