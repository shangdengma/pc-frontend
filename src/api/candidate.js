import request from '../utils/request'

export function getCandidateTask(token) {
  return request({
    url: `/candidate/task/${token}`,
    method: 'get',
    headers: { isToken: false }
  })
}

export function sendCandidateCode(token, phone) {
  return request({
    url: `/candidate/task/${token}/sendCode`,
    method: 'post',
    headers: { isToken: false },
    data: { phone }
  })
}

export function verifyCandidateCode(token, data) {
  return request({
    url: `/candidate/task/${token}/verifyCode`,
    method: 'post',
    headers: { isToken: false },
    data
  })
}

export function consentCandidate(token, ticket) {
  return request({
    url: `/candidate/task/${token}/consent`,
    method: 'post',
    headers: { isToken: false },
    data: { ticket }
  })
}

export function submitCandidateForm(token, data) {
  return request({
    url: `/candidate/task/${token}/submit`,
    method: 'post',
    headers: { isToken: false },
    data,
    timeout: 0
  })
}
